'use client';
import {useEffect,useState} from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export default function Hospital(){
  const [data,setData]=useState(null);
  const [err,setErr]=useState('');

  async function load(){
    setErr('');
    try{
      const r=await fetch('/api/hospital/results',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok)throw new Error(j.message);
      setData(j.results);
    }catch(e){setErr(e.message)}
  }
  useEffect(()=>{load()},[]);

  return <div className="hospital-ui">
    <header className="topbar"><div className="brand">Hospital EMR</div><div className="tag">Clinical Information System</div></header>
    <main className="shell">
      <Nav mode="hospital"/>
      <section className="page-heading">
        <div><h1>External Results</h1><p>Results received from connected diagnostic services.</p></div>
      </section>
      {err&&<div className="notice error">{err}</div>}
      <div className="summary-line">
        <span>Records: <strong>{data?.length??'—'}</strong></span>
        <span>Module: <strong>External Diagnostic Results</strong></span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Patient</th><th>Result</th><th>Code</th><th>Performed</th><th>Received</th></tr></thead>
          <tbody>{data?.map(r=><tr key={r.id}>
            <td>{r.id}</td>
            <td><strong>{r.patient_name}</strong><br/><span className="small muted">{r.external_patient_id} → {r.hospital_patient_id}</span></td>
            <td><strong>{r.observation_name}</strong><br/>{r.value} {r.unit}<br/><span className="small muted">{r.conclusion}</span></td>
            <td className="code">LOINC {r.loinc_code}</td>
            <td>{r.performed_date||'—'}</td>
            <td>{new Date(r.received_at).toLocaleString()}</td>
          </tr>)}</tbody>
        </table>
        {data?.length===0&&<div className="empty">No external results found.</div>}
      </div>
      <Footer/>
    </main>
  </div>;
}
