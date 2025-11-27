document.addEventListener('DOMContentLoaded', () => {

  const username = localStorage.getItem('username');
  const userRole = localStorage.getItem('userRole') || 'Client';
  
  if (!username) {
    alert('Please login first');
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('sidebarUsername').textContent = username;
  document.getElementById('sidebarUserRole').textContent = userRole;

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  mobileMenuBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  const logoutBtn = document.getElementById('sidebarLogoutBtn');
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    window.location.href = '/login.html';
  });

  class AIContentDetector {
    constructor() {
      this.patterns = {
        // Enhanced AI model phrases
        aiModelPhrases: [
          /as an (ai|artificial intelligence) (language model|assistant)/gi,
          /as a (large )?language model/gi,
          /my (training data|knowledge cutoff|algorithm)/gi,
          /i (don't|do not) have (personal |subjective )?(opinions|experiences|feelings|emotions)/gi,
          /i('m| am) (designed|programmed|trained|created) to/gi,
          /based on my (training|programming|design)/gi,
          /according to my (knowledge|training|data)/gi,
          /i cannot (provide|give) (personal|subjective)/gi,
          /my purpose is to|my function is to/gi
        ],
        
        // Enhanced formal structure patterns
        formalStructure: [
          /it is (important|worth noting|crucial|essential) to (note|mention|remember|consider)/gi,
          /furthermore|moreover|additionally|consequently|accordingly/gi,
          /in (summary|conclusion|closing)|to summarize|ultimately/gi,
          /this (paper|work|study|research) (aims to|seeks to|attempts to|strives to)/gi,
          /the (purpose|objective|goal) of this/gi,
          /it should be (noted|emphasized|highlighted) that/gi,
          /on the one hand.*on the other hand/gi,
          /in order to|with the purpose of/gi
        ],
        
        // Enhanced repetitive patterns
        repetitiveStructure: [
          /(first(ly)?.*second(ly)?.*third(ly)?)/gi,
          /(in terms of.*in terms of)/gi,
          /(not only.*but also)/gi,
          /(both.*and.*)/gi,
          /(the.*the.*the)/gi,
          /(it is.*it is.*it is)/gi
        ],
        
        // Enhanced unnatural transitions
        unnaturalTransitions: [
          /thusly|henceforth|heretofore|thereupon|whereupon/gi,
          /in lieu of|with regard to|in relation to|vis-à-vis/gi,
          /it is (apparent|clear|evident|obvious) that/gi,
          /from a.*(perspective|standpoint|viewpoint)/gi,
          /in the context of|with respect to/gi
        ],
        
        // Enhanced corporate buzzwords
        buzzwords: [
          /\bleverage\b|\benhance\b|\bstreamline\b|\butilize\b/gi,
          /\bfacilitate\b|\bimplement\b|\boptimize\b|\bparadigm\b/gi,
          /\bsynergy\b|\bholistic\b|\brobust\b|\bscalable\b/gi,
          /\bseamless\b|\bcutting.?edge\b|\bstate.?of.?the.?art\b/gi,
          /\bdisruptive\b|\binnovative\b|\btransformative\b/gi,
          /\bempower\b|\benable\b|\bdrive\b|\bfoster\b/gi
        ],
        
        // Enhanced vague language
        vagueLanguage: [
          /it can be said that|one might argue that|some may say/gi,
          /generally speaking|broadly speaking|typically/gi,
          /in many cases|in most instances|often times/gi,
          /it is often (the case|seen|observed) that/gi,
          /various aspects|multiple factors|several elements/gi,
          /to a certain extent|in some ways/gi
        ],
        
        // Enhanced perfect language patterns
        perfectLanguage: [
          /; (however|therefore|consequently|thus|moreover),/gi,
          /—.*—/g,
          /\([^)]{20,}\)/g, // Long parenthetical statements
          /\bwherein\b|\bwhereby\b|\bhence\b|\bthus\b/gi,
          /[a-z]\.[A-Z]/g, // Periods between sentences without spaces
          /\d+\.\s*[A-Z][a-z]/g // Numbered lists
        ],
        
        // Enhanced impersonal voice
        impersonalVoice: [
          /this (author|writer|researcher)/gi,
          /the (reader|audience|user) can/gi,
          /it is (believed|thought|considered|argued)/gi,
          /there is a sense that|one can see that/gi,
          /it may be (observed|noted|seen)/gi
        ],
        
        // New: Technical jargon overuse
        technicalJargon: [
          /\balgorithmic\b|\bneural network\b|\btransformer\b/gi,
          /\bparameter\b|\boptimization\b|\bheuristic\b/gi,
          /\bsemantic\b|\bsyntactic\b|\bpragmatic\b/gi,
          /\bvector\b|\bembedding\b|\bencoding\b/gi
        ],
        
        // New: Overly balanced perspectives
        balancedPerspective: [
          /while.*it is also important to consider/gi,
          /on the one hand.*on the other hand/gi,
          /although.*it must be noted that/gi,
          /despite.*it is crucial to recognize/gi
        ]
      };

      this.humanPatterns = [
        /i (think|believe|feel|know) (that)?/gi,
        /in my (opinion|experience|view|perspective)/gi,
        /(frankly|honestly|personally|actually),/gi,
        /(don't|can't|won't|isn't|aren't|wasn't|weren't)/gi,
        /(like|you know|i mean|sort of|kind of)/gi,
        /(lol|omg|btw|imo|tbh|smh)/gi,
        /[.!?]{2,}/g, // Multiple punctuation
        /[a-z][A-Z]/g, // Mixed case (no space)
        /\b(maybe|probably|perhaps|possibly)\b/gi,
        /\b(actually|basically|literally|seriously)\b/gi,
        /haha|hehe|lmao/gi,
        /(\w{3,})\1/gi // Repeated words
      ];

      this.aiWordLists = {
        commonAIPhrases: [
          'delve','tapestry','realm','testament','nuanced','multifaceted',
          'underscore','pivotal','crucial','paramount','imperative','leverage',
          'synergy','robust','holistic','seamless','granular','foster','cultivate',
          'nurture','harness','galvanize','illuminate','embark','journey',
          'landscape','fabric','essence','core','fundamental','intricate'
        ],
        humanWords: [
          'maybe','probably','perhaps','sort of','kind of','a bit','actually',
          'basically','literally','seriously','obviously','honestly','frankly'
        ]
      };
      
      this.weights = {
        aiModelPhrases: 3,
        formalStructure: 2,
        repetitiveStructure: 2,
        unnaturalTransitions: 2,
        buzzwords: 1,
        vagueLanguage: 1,
        perfectLanguage: 2,
        impersonalVoice: 2,
        technicalJargon: 3,
        balancedPerspective: 2
      };
    }

    analyzeText(text) {
      if (!text || text.trim().length < 50)
        return { score:0, verdict:'Insufficient text (minimum 50 characters required)', details:[], highlightedText:text };

      let aiScore=0,humanScore=0,details=[],highlightedText=text;

      // Analyze AI patterns with weights
      Object.entries(this.patterns).forEach(([category,patterns])=>{
        let matchesTotal=0;
        patterns.forEach(pattern=>{
          const m=text.match(pattern);
          if(m){
            matchesTotal += m.length;
            const weight = this.weights[category] || 1;
            aiScore += m.length * weight;
            highlightedText = highlightedText.replace(pattern, x=>`<span class="bg-yellow-300">${x}</span>`);
          }
        });
        if(matchesTotal>0){
          details.push({category, matches:matchesTotal, weight: this.weights[category] || 1});
        }
      });

      // Analyze AI word lists
      this.aiWordLists.commonAIPhrases.forEach(w=>{
        const r=new RegExp(`\\b${w}\\b`,'gi');
        const m=text.match(r);
        if(m){
          aiScore += m.length * 2;
          highlightedText=highlightedText.replace(r,x=>`<span class="bg-yellow-300">${x}</span>`);
        }
      });

      // Analyze human patterns
      this.humanPatterns.forEach(p=>{
        const m=text.match(p);
        if(m){
          humanScore += m.length;
          highlightedText=highlightedText.replace(p,x=>`<span class="bg-green-200">${x}</span>`);
        }
      });

      // Analyze human word lists
      this.aiWordLists.humanWords.forEach(w=>{
        const r=new RegExp(`\\b${w}\\b`,'gi');
        if(text.match(r)){
          humanScore+=1;
          highlightedText=highlightedText.replace(r,x=>`<span class="bg-green-200">${x}</span>`);
        }
      });

      // Calculate final score with normalization
      const textLength = text.length;
      const normalizedAIScore = Math.min(aiScore * 100 / (textLength / 10), 100);
      const normalizedHumanScore = Math.min(humanScore * 50 / (textLength / 10), 50);
      
      let score = Math.max(0, Math.min(100, normalizedAIScore - normalizedHumanScore));

      // More nuanced verdict system
      let verdict =
        score<10?'✅ Very Likely Human-Written':
        score<25?'✅ Likely Human-Written':
        score<40?'🟡 Possibly AI-Assisted':
        score<60?'⚠️ Likely AI-Generated':
        score<80?'🔍 Strong AI Indicators':
        '❌ Very Likely AI-Generated';

      return {
        score: Math.round(score), 
        verdict, 
        details, 
        highlightedText,
        metrics: {
          aiIndicators: aiScore,
          humanIndicators: humanScore,
          textLength: textLength
        }
      };
    }
  }

  async function readFileAsArrayBuffer(file){
    return new Promise((res,rej)=>{
      const r=new FileReader();
      r.onload=e=>res(e.target.result);
      r.onerror=rej;
      r.readAsArrayBuffer(file);
    });
  }

  async function extractPdfText(file){
    try{
      const pdfjs = window.pdfjsLib || window['pdfjsLib'];
      if(!pdfjs) return '';
      const buf=await readFileAsArrayBuffer(file);
      const pdf=await pdfjs.getDocument({data:buf}).promise;
      let t='';
      for(let i=1;i<=pdf.numPages;i++){
        const p=await pdf.getPage(i);
        const c=await p.getTextContent();
        t+=c.items.map(a=>a.str).join(' ')+'\n';
      }
      return t;
    }catch{return '';}
  }

  async function extractDocxText(file){
    try{
      const buf=await readFileAsArrayBuffer(file);
      const r=await mammoth.extractRawText({arrayBuffer:buf});
      return r.value||'';
    }catch{return '';}
  }

  async function extractFileText(file){
    const ext=file.name.split('.').pop().toLowerCase();
    if(ext==='pdf')return await extractPdfText(file);
    if(ext==='docx')return await extractDocxText(file);
    if(ext==='txt'){
      const text=await file.text();
      return text;
    }
    return '';
  }

  const form=document.getElementById('submitWorkForm');
  const descriptionTextarea=document.getElementById('description');
  const charCount=document.getElementById('charCount');
  const checkAIBtn=document.getElementById('checkAIBtn');
  const aiResultPanel=document.getElementById('aiResultPanel');
  const editContentBtn=document.getElementById('editContentBtn');
  const proceedSubmitBtn=document.getElementById('proceedSubmitBtn');
  const fileInput=document.getElementById('workFile');
  const detector=new AIContentDetector();

  descriptionTextarea.addEventListener('input',()=>{
    charCount.textContent = descriptionTextarea.innerText.length;
    if(descriptionTextarea.innerText.length>1000){
      descriptionTextarea.innerText = descriptionTextarea.innerText.substring(0,1000);
      charCount.textContent='1000';
    }
  });

  checkAIBtn?.addEventListener('click', async () => {
    let text = descriptionTextarea.textContent.trim();
    if (!text) text = descriptionTextarea.innerHTML.replace(/<[^>]+>/g,'').trim();
    if (!text) {
      alert('Please enter some text to analyze.');
      return;
    }
    
    if(fileInput.files.length>0){
      const ft=await extractFileText(fileInput.files[0]);
      if(ft.trim()!=='') text+='\n\n'+ft;
    }

    const analysis=detector.analyzeText(text);

    document.getElementById('aiPercentage').textContent = `${analysis.score}%`;
    document.getElementById('aiVerdict').textContent = analysis.verdict;

    const pb=document.getElementById('aiProgressBar');
    pb.style.width=`${analysis.score}%`;
    pb.style.backgroundColor=
      analysis.score<25?'#10b981':
      analysis.score<40?'#22c55e':
      analysis.score<60?'#f59e0b':
      analysis.score<80?'#ef4444':'#dc2626';

    const details=document.getElementById('aiAnalysisDetails');
    details.innerHTML=analysis.details.map(d=>`
      <div class="p-2 bg-gray-100 rounded mb-1">
        <strong>${d.category}:</strong> ${d.matches} matches (weight: ${d.weight})
      </div>
    `).join('');

    // Add metrics display
    const metricsDiv = document.createElement('div');
    metricsDiv.className = 'mt-3 p-2 bg-blue-50 rounded text-sm';
    metricsDiv.innerHTML = `
      <strong>Text Analysis:</strong><br>
      - Length: ${analysis.metrics.textLength} characters<br>
      - AI Indicators: ${analysis.metrics.aiIndicators}<br>
      - Human Indicators: ${analysis.metrics.humanIndicators}
    `;
    details.appendChild(metricsDiv);

    descriptionTextarea.innerHTML = analysis.highlightedText;
    aiResultPanel.classList.remove('hidden');
  });

  editContentBtn?.addEventListener('click',()=>{
    aiResultPanel.classList.add('hidden');
    descriptionTextarea.focus();
  });

  proceedSubmitBtn?.addEventListener('click',()=>{
    aiResultPanel.classList.add('hidden');
    form.dispatchEvent(new Event('submit'));
  });

  form.addEventListener('submit', async e=>{
    e.preventDefault();

    const title=document.getElementById('title').value.trim();
    const description=descriptionTextarea.textContent.trim() || descriptionTextarea.innerHTML.replace(/<[^>]+>/g,'').trim();
    const category=document.querySelector('input[name="category"]:checked')?.value;

    if(!title||!description||!category){
      alert('Please complete all fields.');
      return;
    }

    const fd=new FormData();
    fd.append('title',title);
    fd.append('description',description);
    fd.append('category',category);
    fd.append('username',username);

    let file=null;
    if(fileInput.files.length>0){
      file=fileInput.files[0];
      fd.append('workFile',file);
    }

    let combined = title+' '+description;
    if(file){
      const ft=await extractFileText(file);
      if(ft.trim()!=='') combined+='\n\n'+ft;
    }

    const analysis=detector.analyzeText(combined);
    
    // Enhanced warning system with different thresholds
    if(analysis.score>80){
      if(!confirm('❌ Strong AI detection: This work appears very likely to be AI-generated. Continue anyway?')) return;
    }else if(analysis.score>60){
      if(!confirm('⚠️ AI detection: This work shows strong AI indicators. Continue anyway?')) return;
    }else if(analysis.score>40){
      if(!confirm('🟡 Note: This work shows some AI indicators. Continue?')) return;
    }

    try{
      const r=await fetch('/submit-work',{method:'POST',body:fd});
      if(r.ok){
        alert('Work submitted successfully!');
        form.reset();
        charCount.textContent='0';
        descriptionTextarea.innerHTML='';
        aiResultPanel.classList.add('hidden');
      }else{
        const err=await r.json();
        alert(err.message||'Failed to submit.');
      }
    }catch{
      alert('Network error.');
    }
  });

});