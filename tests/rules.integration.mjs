import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,set,get,update,push,remove,serverTimestamp} from 'firebase/database';
// The Node RTDB SDK ignores NO_PROXY when configuring its WebSocket transport.
// This test process talks only to the loopback demo emulator; avoid sending it to a proxy.
for(const key of ['HTTP_PROXY','HTTPS_PROXY','http_proxy','https_proxy'])delete process.env[key];
const env=await initializeTestEnvironment({projectId:'demo-music-center',database:{host:'127.0.0.1',port:9000,rules:await readFile('firebase-database.rules.json','utf8')}});
const db=id=>env.authenticatedContext(id).database();const a=db('musician-a'),b=db('musician-b'),outsider=db('outsider'),master=db('master-sean'),guest=env.unauthenticatedContext().database();
const at=key=>'musicV1/'+key;let checked=0;
async function pass(label,operation){await operation();checked++;console.log('PASS',label);}
async function signup(client,uid,name,messageId,key){await update(ref(client,at('')),{[`profiles/${uid}`]:{displayName:name,messageId,messageLookupKey:key,createdAt:serverTimestamp()},[`messageLookup/${key}`]:uid});}
try{
 await env.clearDatabase();
 await pass('Atomic profile + recipient lookup creation succeeds',()=>assertSucceeds(signup(a,'musician-a','Artist A','ABCDEFGH23456789','a'.repeat(64))));
 await pass('Second user can create only their own profile',()=>assertSucceeds(signup(b,'musician-b','Artist B','BCDEFGHJ23456789','b'.repeat(64))));
 await pass('Nobody can create a profile for another UID',()=>assertFails(signup(outsider,'forged-user','Forged','CDEFGHJK23456789','c'.repeat(64))));
 await pass('Profile takeover is denied',()=>assertFails(set(ref(outsider,at('profiles/musician-a/displayName')),'Intruder')));
 await pass('Recipient-key collision is denied atomically',()=>assertFails(signup(outsider,'outsider','Intruder','CDEFGHJK23456789','a'.repeat(64))));
 await pass('Private profile is readable by its owner',()=>assertSucceeds(get(ref(a,at('profiles/musician-a')))));
 await pass('Private profile cannot be read by another user',()=>assertFails(get(ref(b,at('profiles/musician-a')))));
 await pass('Root directory enumeration is denied',()=>assertFails(get(ref(a,at('')))));
 await pass('Recipient lookup enumeration is denied',()=>assertFails(get(ref(a,at('messageLookup')))));
 await pass('Exact recipient lookup is available to signed-in users',()=>assertSucceeds(get(ref(a,at('messageLookup/'+'b'.repeat(64))))));
 await pass('Client-side master promotion is denied',()=>assertFails(set(ref(a,at('admins/musician-a')),true)));
 await pass('Client-side role-field injection is denied',()=>assertFails(set(ref(a,at('profiles/musician-a/role')),'master')));
 const id=push(ref(a,at('mailboxes/musician-a'))).key;
 const message={fromUid:'musician-a',fromName:'Artist A',fromMessageId:'ABCDEFGH23456789',toUid:'musician-b',toName:'Artist B',recipientKey:'b'.repeat(64),body:'Test message in emulator only.',createdAt:serverTimestamp()};
 const send=(client,m,id2=id)=>update(ref(client,at('')),{[`mailboxes/musician-a/${id2}`]:m,[`mailboxes/musician-b/${id2}`]:m});
 await pass('Sender can atomically deliver matching mailbox copies',()=>assertSucceeds(send(a,message)));
 await pass('Recipient can read their own inbox',()=>assertSucceeds(get(ref(b,at('mailboxes/musician-b')))));
 await pass('Sender cannot read recipient inbox',()=>assertFails(get(ref(a,at('mailboxes/musician-b')))));
 await pass('Unrelated user cannot read either message',()=>assertFails(get(ref(outsider,at('mailboxes/musician-a/'+id)))));
 await pass('Spoofed sender is rejected',()=>assertFails(send(outsider,message,push(ref(a,at('mailboxes/musician-a'))).key)));
 await pass('Changing a delivered message is rejected',()=>assertFails(set(ref(a,at('mailboxes/musician-a/'+id+'/body')),'Changed')));
 await pass('Sender cannot delete recipient copy',()=>assertFails(remove(ref(a,at('mailboxes/musician-b/'+id)))));
 await pass('Recipient may remove their own copy',()=>assertSucceeds(remove(ref(b,at('mailboxes/musician-b/'+id)))));
 await pass('Sender copy remains after recipient removes theirs',async()=>assert.equal((await get(ref(a,at('mailboxes/musician-a/'+id)))).exists(),true));
 const edit={content:'{"id":"test-song"}',previousContent:'{"id":"test-song"}',revision:1,updatedBy:'musician-a',updatedAt:serverTimestamp()};
 await pass('Ordinary musician cannot publish songs',()=>assertFails(set(ref(a,at('songEdits/test-song')),edit)));
 await pass('Guest cannot publish songs',()=>assertFails(set(ref(guest,at('songEdits/test-song')),edit)));
 await env.withSecurityRulesDisabled(async c=>set(ref(c.database(),at('admins/master-sean')),true));
 await pass('Server-granted master can publish',()=>assertSucceeds(set(ref(master,at('songEdits/test-song')),{...edit,updatedBy:'master-sean'})));
 await pass('Published songs are readable without signing in',()=>assertSucceeds(get(ref(guest,at('songEdits')))));
 await pass('Master still cannot read private mailboxes',()=>assertFails(get(ref(master,at('mailboxes/musician-a')))));
 await pass('Stale revision cannot overwrite a new song version',()=>assertFails(set(ref(master,at('songEdits/test-song')),{...edit,updatedBy:'master-sean'})));
 await pass('Next revision is accepted',()=>assertSucceeds(set(ref(master,at('songEdits/test-song')),{...edit,updatedBy:'master-sean',revision:2})));
 console.log(`Verified ${checked} authorization and data-integrity checks against the Realtime Database emulator.`);
}finally{await env.cleanup();}
