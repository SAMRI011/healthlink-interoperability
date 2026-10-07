'use client';
import {useEffect,useState} from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export default function Exchange(){
  const [logs,setLogs]=useState(null);
  const [health,setHealth]=useState(null);
  const [err,setErr]=useState('');

  async function load(){
    try{
      const [a,b]=await Promise.all([fetch('/api/exchange/logs',{cache:'no-store'}),fetch('/api/health',{cache:'no-store'})]);
      const aj=await a.json(),bj=await b.json();
      if(!a.ok)throw new Error(aj.message);
      setLogs(aj.logs);
      setHealth(bj);
    }catch(e){setErr(e.message)}
  }
  useEffect(()=>{load()},[]);

  return <div className="exchange-ui">
    <header className="topbar"><div className="brand">HealthLink Exchange</div><div className="tag">Operations Console</div></header>
    <main className="shell">
      <Nav mode="exchange"/>
      <section className="page-heading">
        <div><h1>Transaction Log</h1><p>Inbound and outbound message activity.</p></div>
      </section>
      {err&&<div className="notice error">{err}</div>}
      <div className="service-strip">
        <span>Service: <strong className={`status ${health?.status==='online'?'ok':''}`}>{health?.status||'checking'}</strong></span>
        <span>Database: <strong className={`status ${health?.database==='configured'?'ok':'bad'}`}>{health?.database||'checking'}</strong></span>
        <span className="count">Transactions shown: <strong>{logs?.length??'—'}</strong></span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Time</th><th>Source</th><th>Destination</th><th>Type</th><th>Status</th><th>Detail</th></tr></thead>
          <tbody>{logs?.map(x=><tr key={x.id}>
            <td>{new Date(x.created_at).toLocaleString()}</td>
            <td>{x.source_system}</td>
            <td>{x.destination}</td>
            <td>{x.resource_type}</td>
            <td><span className={`status ${x.http_status>=200&&x.http_status<300?'ok':'bad'}`}>{x.status} / {x.http_status}</span></td>
            <td>{x.detail}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <Footer/>
    </main>
  </div>;
}
