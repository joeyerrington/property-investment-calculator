const ids=["startYear","purchasePrice","deposit","buyingCosts","interestRate","loanTerm","rent","propertyCosts","appreciation","rentGrowth","sellingCosts","costBase","capitalLosses","cgtDiscount","mainResidence","taxRate"];
const form=document.getElementById("assumptions"),body=document.getElementById("results"),summary=document.getElementById("summary");
const money=new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD",maximumFractionDigits:0});
const fmt=n=>money.format(Number.isFinite(n)?n:0);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function update(){
 const p=Object.fromEntries(ids.map(id=>[id,Number(document.getElementById(id).value)||0]));
 const term=clamp(Math.round(p.loanTerm),1,100),loan=Math.max(0,p.purchasePrice-p.deposit),rate=p.interestRate/100;
 const payment=loan===0?0:Math.abs(rate)<1e-12?loan/term:loan*rate/(1-Math.pow(1+rate,-term));
 document.getElementById("loanAmount").value=fmt(loan);
 document.getElementById("loanRepayment").value=fmt(payment);
 let value=p.purchasePrice,balance=loan,rental=p.rent,cumulative=0,rows=[];
 for(let y=0;y<=term;y++){
   let annual=0;
   if(y>0){
     value*=1+p.appreciation/100;
     if(y>1)rental*=1+p.rentGrowth/100;
     const interest=balance*rate;
     const actualPayment=Math.min(payment,balance+interest);
     balance=Math.max(0,balance+interest-actualPayment);
     annual=rental-p.propertyCosts-actualPayment;
     cumulative+=annual;
   }
   const saleCosts=value*clamp(p.sellingCosts,0,100)/100;
   // Capital losses applied before CGT discount. Partial exemption is a simplified fraction.
   const gain=Math.max(0,value-saleCosts-p.purchasePrice-p.buyingCosts-p.costBase);
   const taxableAfterExemption=gain*(1-clamp(p.mainResidence,0,100)/100);
   const gainAfterLosses=Math.max(0,taxableAfterExemption-p.capitalLosses);
   const discount=y>=1?clamp(p.cgtDiscount,0,100)/100:0;
   const cgt=gainAfterLosses*(1-discount)*clamp(p.taxRate,0,100)/100;
   const proceeds=value-balance-saleCosts-cgt;
   const net=proceeds+cumulative-p.deposit-p.buyingCosts;
   rows.push({year:p.startYear+y,net,value,balance,rental:y?rental:0,annual,cumulative,cgt,proceeds});
 }
 body.innerHTML=rows.map(r=>`<tr><td>${r.year}</td>${["net","value","balance","rental","annual","cumulative","cgt","proceeds"].map(k=>`<td class="${r[k]<0?"negative":k==="net"&&r[k]>0?"positive":""}">${fmt(r[k])}</td>`).join("")}</tr>`).join("");
 const last=rows[rows.length-1];
 summary.innerHTML=[["Final property value",last.value],["Final loan balance",last.balance],["Cumulative cash flow",last.cumulative],["Estimated CGT on sale",last.cgt],["Net sale proceeds",last.proceeds],["Net investment gain",last.net]].map(([label,v])=>`<div class="stat"><small>${label}</small><strong class="${v<0?"negative":""}">${fmt(v)}</strong></div>`).join("");
}
form.addEventListener("input",update);
update();