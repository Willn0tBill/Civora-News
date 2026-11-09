(()=>{"use strict";
const reading=window.CivoraReading;
const cards=[...document.querySelectorAll("[data-discover-item]")];
const current=cards[0];
if(!current)return;
const byId=new Map(cards.map(el=>[el.dataset.storyId,el]));
const pickCategory=document.querySelector("#pick-category");
const pickTitle=document.querySelector("#pick-title");
const pickSummary=document.querySelector("#pick-summary");
const pickLink=document.querySelector("#pick-link");
const pickSave=document.querySelector("#pick-save");
let currentId=current.dataset.storyId;
function selectStory(el){
 currentId=el.dataset.storyId;
 pickCategory.textContent=el.dataset.category;
 pickTitle.textContent=el.dataset.title;
 pickSummary.textContent=el.dataset.summary;
 pickLink.href=el.querySelector(".discover-item-actions a").href;
 pickSave.dataset.saveStory=currentId;
 pickSave.dataset.storyTitle=el.dataset.title;
 reading?.refresh();
}
selectStory(current);
const shuffle=document.querySelector("[data-discover-shuffle]");
shuffle?.addEventListener("click",event=>{
 event.preventDefault();
 if(cards.length<2){selectStory(current);return;}
 const choices=cards.filter(x=>x.dataset.storyId!==currentId);
 selectStory(choices[Math.floor(Math.random()*choices.length)]);
});
const filterButtons=[...document.querySelectorAll("[data-topic-filter]")];
const count=document.querySelector("#discover-count");
function setFilter(filter){
 let shown=0;
 for(const card of cards){
  const show=filter==="all"||card.dataset.category===filter;
  card.hidden=!show;if(show)shown++;
 }
 for(const btn of filterButtons)btn.setAttribute("aria-pressed",String(btn.dataset.topicFilter===filter));
 count.textContent=shown+" "+(shown===1?"story":"stories")+" to explore";
}
for(const btn of filterButtons)btn.addEventListener("click",()=>setFilter(btn.dataset.topicFilter));
setFilter("all");

const savedList=document.querySelector("#saved-stories");
const recentList=document.querySelector("#recent-stories");
const savedEmpty=document.querySelector("#saved-empty");
const recentEmpty=document.querySelector("#recent-empty");
const savedTotal=document.querySelector("#saved-total");
const recentTotal=document.querySelector("#recent-total");
function fillShelf(element,ids,empty,countElement,includeRemove){
 element.replaceChildren();
 const available=ids.map(id=>byId.get(id)).filter(Boolean).slice(0,6);
 empty.hidden=available.length>0;
 countElement.textContent=String(available.length);
 for(const item of available){
  const row=document.createElement("li");
  const left=document.createElement("div");
  const cat=document.createElement("small");cat.textContent=item.dataset.category;
  const link=document.createElement("a");link.href=item.querySelector(".discover-item-actions a").href;link.textContent=item.dataset.title;
  left.append(cat,link);row.append(left);
  if(includeRemove){
   const remove=document.createElement("button");
   remove.type="button";remove.textContent="Remove";
   remove.setAttribute("aria-label","Remove "+item.dataset.title+" from reading list");
   remove.addEventListener("click",()=>{reading.toggleSave(item.dataset.storyId);reading.refresh();});
   row.append(remove);
  }
  element.append(row);
 }
}
function updateShelves(){
 if(!reading)return;
 fillShelf(savedList,reading.getSaved(),savedEmpty,savedTotal,true);
 fillShelf(recentList,reading.getRecent(),recentEmpty,recentTotal,false);
}
window.addEventListener("civora:reading-change",updateShelves);
window.addEventListener("storage",updateShelves);
updateShelves();

const quizStage=document.querySelector("#quiz-stage");
const questions=[
 {q:"A dramatic video clip is spreading without its original date. What's the strongest first check?",options:["Count how many people shared it","Find the original recording and verify when and where it was made","Trust whichever caption appears most often"],correct:1,why:"Context comes before conclusions. Reposted footage may be genuine but unrelated to the event being discussed."},
 {q:"An article cites a survey of 35 people and calls it a nationwide trend. What should you examine?",options:["The survey's sampling method and size","Whether the headline uses confident language","How colorful its charts are"],correct:0,why:"A small or unrepresentative sample can make a broad claim unreliable. Check how respondents were selected and what the study can actually support."},
 {q:"Two articles disagree on a scientific finding. What's a useful next step?",options:["Pick the shorter one","Assume both must be equally correct","Check the underlying study, methods and independent expert context"],correct:2,why:"A disagreement is an invitation to examine evidence, not an automatic reason to split the difference."},
 {q:"A report says inflation slowed from 6% to 3%. Which conclusion is justified?",options:["Average prices are necessarily falling","Prices may still be rising, but at a slower rate","Everything is now 3% cheaper"],correct:1,why:"A lower positive inflation rate means the rate of price increases has slowed—not that prices automatically decreased."},
 {q:"A story praises a product and was paid for by the manufacturer. How should readers encounter it?",options:["With a clear sponsorship disclosure","Presented as an independent investigation","Without attribution to keep the layout clean"],correct:0,why:"Sponsored work must be identified clearly so readers can distinguish advertising from independent editorial decisions."}
];
let quizIndex=0,score=0,answered=false;
function el(tag,cls,text){const element=document.createElement(tag);if(cls)element.className=cls;if(text!==undefined)element.textContent=text;return element;}
function renderQuiz(){
 quizStage.replaceChildren();
 if(quizIndex>=questions.length){
  const wrap=el("div","quiz-results");
  wrap.append(el("div","quiz-meta","THE READING ROOM / COMPLETED"),el("h3","",score+" of "+questions.length+" correct"));
  wrap.append(el("p","",score===questions.length?"Excellent source instincts. Keep questioning what you read.":"Every careful reader improves by checking evidence. Try again or explore Civora's editorial standards."));
  const retry=el("button","quiz-next","Try again ↻");
  retry.type="button";retry.addEventListener("click",()=>{quizIndex=0;score=0;renderQuiz()});
  wrap.append(retry);
  quizStage.append(wrap);
  return;
 }
 answered=false;
 const current=questions[quizIndex];
 const meta=el("div","quiz-meta");
 meta.append(el("span","",String(quizIndex+1).padStart(2,"0")+" / "+String(questions.length).padStart(2,"0")),el("span","",score+" CORRECT SO FAR"));
 quizStage.append(meta,el("h3","quiz-question",current.q));
 const choices=el("div","quiz-answers");
 current.options.forEach((option,i)=>{
  const btn=el("button","quiz-answer",(String.fromCharCode(65+i))+".  "+option);
  btn.type="button";
  btn.addEventListener("click",()=>{
   if(answered)return;answered=true;
   if(i===current.correct)score++;
   for(const [j,answer] of [...choices.children].entries()){
    answer.disabled=true;
    if(j===current.correct)answer.classList.add("is-correct");
    else if(j===i)answer.classList.add("is-incorrect");
   }
   const feedback=el("div","quiz-feedback",(i===current.correct?"Correct. ":"Not quite. ")+current.why);
   quizStage.append(feedback);
   const next=el("button","quiz-next",quizIndex===questions.length-1?"See your results →":"Next question →");
   next.type="button";next.addEventListener("click",()=>{quizIndex++;renderQuiz()});
   quizStage.append(next);
  });
  choices.append(btn);
 });
 quizStage.append(choices);
}
if(quizStage)renderQuiz();
})();
