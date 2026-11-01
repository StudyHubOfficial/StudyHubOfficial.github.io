"use strict";
// RUN ON YOUR OWN PC (private). Replaces only the verifier in functions/index.js.
// Does not print or save the plaintext password. Redeploy Cloud Function after use.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const indexFile=path.resolve(__dirname,'../functions/index.js');
function hiddenPrompt(label){return new Promise((resolve,reject)=>{
  if(!process.stdin.isTTY || !process.stdin.setRawMode) return reject(Error('An interactive terminal is required.'));
  let chars=[];process.stdout.write(label);const previous=process.stdin.isRaw;process.stdin.setRawMode(true);process.stdin.resume();
  function finish(error,result){process.stdin.off('data',onData);process.stdin.setRawMode(Boolean(previous));process.stdin.pause();process.stdout.write('\n');chars=[];error?reject(error):resolve(result);}
  function onData(buf){for(const c of buf){if(c===3)return finish(Error('Cancelled'));if(c===10||c===13)return finish(null,chars.join(''));if(c===8||c===127){if(chars.length){chars.pop();process.stdout.write('\b \b');}continue;}if(c>=32&&c<=126){chars.push(String.fromCharCode(c));process.stdout.write('*');}}}
  process.stdin.on('data',onData);
});}
(async()=>{
 const password=await hiddenPrompt('New Second Admin password: ');
 if(password.length<12)throw Error('Choose at least 12 characters.');
 if(password!==await hiddenPrompt('Confirm new password: '))throw Error('Passwords do not match.');
 const salt=crypto.randomBytes(24),hash=crypto.scryptSync(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024});
 const before=fs.readFileSync(indexFile,'utf8');
 const after=before.replace(/const PASSWORD_SALT_HEX = "[a-f0-9]+";/,'const PASSWORD_SALT_HEX = "'+salt.toString('hex')+'";').replace(/const PASSWORD_SCRYPT_HEX = "[a-f0-9]+";/,'const PASSWORD_SCRYPT_HEX = "'+hash.toString('hex')+'";');
 if(after===before)throw Error('Password verifier fields not found in functions/index.js.');
 fs.writeFileSync(indexFile,after);console.log('Verifier updated. Deploy: firebase deploy --only functions:studyhubSecondaryLogin --project studyhubofficial-2e2de');
})().catch(e=>{console.error(e.message||e);process.exitCode=1});
