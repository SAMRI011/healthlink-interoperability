import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { registryOverview } from '@/lib/identity-registry';

export default function Registry(){
  const rows=registryOverview();
  return <div className="exchange-ui">
    <header className="topbar"><div className="brand">HealthLink Exchange</div><div className="tag">Identity Services</div></header>
    <main className="shell">
      <Nav mode="exchange"/>
      <section className="page-heading"><div><h1>Client Registry</h1><p>Resolves local patient identities across connected health systems.</p></div></section>
      <div className="notice"><strong>Protected identity matching:</strong> This demo uses a synthetic Fayda identity as an internal matching anchor. The identifier itself is not exposed to the Diagnostic Center or Hospital EMR.</div>
      <div className="summary-line"><span>Identity links: <strong>{rows.length}</strong></span><span>Identity anchor: <strong>Protected synthetic Fayda</strong></span></div>
      <div className="table-wrap"><table><thead><tr><th>Diagnostic Center ID</th><th>Match</th><th>Hospital ID</th><th>Patient</th><th>Identity Anchor</th></tr></thead><tbody>{rows.map((p)=><tr key={p.diagnosticPatientId}><td className="code">{p.diagnosticPatientId}</td><td><span className="status ok">{p.status}</span></td><td className="code">{p.hospitalPatientId}</td><td>{p.name}</td><td>{p.identityAnchor}</td></tr>)}</tbody></table></div>
      <Footer/>
    </main>
  </div>;
}
