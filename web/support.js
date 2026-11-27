const message=document.querySelector('#support-status');
function render(state){
 const count=document.querySelector('#count');
 if(count)count.textContent=state.total+' '+(state.total===1?'signature':'signatures');
 for(const button of document.querySelectorAll('[data-choice]')){
   const recorded=state.choices.includes(button.dataset.choice);
   button.disabled=recorded;
   if(recorded)button.textContent=button.dataset.choice==='petition-platform-label'?'You signed':'Interest recorded';
 }
 return state;
}
async function request(init){const r=await fetch('/api/support',init);if(!r.ok)throw Error('Signup unavailable. Please try again later.');return render(await r.json());}
let ready=request().catch(e=>{message.textContent=e.message;return null});
for(const button of document.querySelectorAll('[data-choice]'))button.addEventListener('click',async()=>{
 try{
 const state=await ready || await request();
 if(!state.signedIn){window.top.location.href='/signin-with-chatgpt?return_to='+encodeURIComponent(location.pathname+location.hash);return;}
 button.disabled=true;
 const next=await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({choice:button.dataset.choice})});
 ready=Promise.resolve(next);message.textContent=button.dataset.choice==='petition-platform-label'?'Your signature is counted. Thank you.':'Your interest is recorded. No order or payment was taken.';
 }catch(e){button.disabled=false;message.textContent=e.message;}
});
