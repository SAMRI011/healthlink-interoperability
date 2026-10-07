import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { PATIENT_LINKS } from '@/lib/catalog';

export default function Registry(){
  return <div className="hospital-ui">
    <header className="topbar"><div className="brand">Hospital EMR</div><div className="tag">Clinical Information System</div></header>
    <main className="shell">
      <Nav mode="hospital"/>
      <section className="page-heading"><div><h1>Client Registry</h1><p>Linked patient identifiers used for external result matching.</p></div></section>
      <div className="summary-line"><span>Identifier links: <strong>{Object.keys(PATIENT_LINKS).length}</strong></span></div>
      <div className="table-wrap"><table><thead><tr><th>External ID</th><th>Hospital ID</th><th>Patient</th></tr></thead><tbody>{Object.entries(PATIENT_LINKS).map(([id,p])=><tr key={id}><td className="code">{id}</td><td className="code">{p.hospitalPatientId}</td><td>{p.name}</td></tr>)}</tbody></table></div>
      <Footer/>
    </main>
  </div>;
}
