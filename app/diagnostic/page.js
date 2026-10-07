'use client';
import { useState } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

const types = [
  ['lvef','Left ventricular ejection fraction (%)'],
  ['hemoglobin','Hemoglobin (g/dL)'],
  ['creatinine','Creatinine (mg/dL)'],
  ['glucose','Glucose (mg/dL)']
];

export default function Diagnostic(){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState(null);
  const today=new Date().toISOString().slice(0,10);

  async function submit(e){
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const form=new FormData(e.currentTarget);
    const body=Object.fromEntries(form.entries());
    try{
      const r=await fetch('/api/diagnostic/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await r.json();
      setMessage({ok:r.ok,status:r.status,text:data.message||data.status||'Completed',data});
    }catch(err){
      setMessage({ok:false,status:0,text:'The request could not be completed.',data:{detail:String(err)}});
    }finally{
      setBusy(false);
    }
  }

  return <div className="diagnostic-ui">
    <header className="topbar"><div className="brand">Addis Diagnostic Center</div><div className="tag">Laboratory Results</div></header>
    <main className="shell">
      <Nav mode="diagnostic"/>
      <section className="page-heading">
        <div><h1>External Result Entry</h1><p>Enter a completed diagnostic result for transfer to the receiving facility.</p></div>
      </section>
      <section className="panel">
        <div className="panel-title">Result Details</div>
        <form onSubmit={submit}>
          <div className="form-row">
            <div><label>External Patient ID</label><input name="externalPatientId" defaultValue="DC-8472" required/></div>
            <div><label>Result Type</label><select name="resultType" defaultValue="hemoglobin">{types.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div><label>Result Value</label><input name="value" type="number" step="any" defaultValue="13.5" required/></div>
            <div><label>Performed Date</label><input name="performedDate" type="date" defaultValue={today} required/></div>
          </div>
          <label>Comment</label>
          <textarea name="conclusion" defaultValue="Synthetic external diagnostic result."/>
          <button disabled={busy}>{busy?'Sending…':'Submit Result'}</button>
        </form>
      </section>
      {message&&<div className={`notice ${message.ok?'ok':'error'}`}>
        <strong>{message.ok?'Accepted':'Not accepted'} — HTTP {message.status||'network error'}</strong>
        <div>{message.text}</div>
        {message.data?.hospitalPatientId&&<div className="small">Hospital patient ID: {message.data.hospitalPatientId}</div>}
      </div>}
      <Footer/>
    </main>
  </div>;
}
