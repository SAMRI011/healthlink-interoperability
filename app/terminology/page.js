import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { RESULT_TYPES } from '@/lib/catalog';

export default function Terminology(){
  return <div className="hospital-ui">
    <header className="topbar"><div className="brand">Hospital EMR</div><div className="tag">Clinical Information System</div></header>
    <main className="shell">
      <Nav mode="hospital"/>
      <section className="page-heading"><div><h1>Terminology</h1><p>Configured observation codes and accepted units.</p></div></section>
      <div className="summary-line"><span>Configured concepts: <strong>{Object.keys(RESULT_TYPES).length}</strong></span></div>
      <div className="table-wrap"><table><thead><tr><th>Observation</th><th>LOINC</th><th>Expected Unit</th></tr></thead><tbody>{Object.values(RESULT_TYPES).map(x=><tr key={x.loinc}><td>{x.name}</td><td className="code">{x.loinc}</td><td className="code">{x.unit}</td></tr>)}</tbody></table></div>
      <Footer/>
    </main>
  </div>;
}
