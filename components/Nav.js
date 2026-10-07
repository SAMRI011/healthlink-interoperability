export default function Nav({ mode = 'all' }) {
  const links = {
    diagnostic: [['Diagnostic Center', '/diagnostic']],
    exchange: [['Interoperability Layer', '/exchange']],
    hospital: [
      ['Hospital EMR', '/hospital'],
      ['Client Registry', '/registry'],
      ['Terminology', '/terminology']
    ],
    all: [
      ['Overview', '/'],
      ['Diagnostic Center', '/diagnostic'],
      ['Hospital EMR', '/hospital'],
      ['Interoperability Layer', '/exchange'],
      ['Client Registry', '/registry'],
      ['Terminology', '/terminology']
    ]
  };

  return <nav className="nav">
    {(links[mode] || links.all).map(([label, href]) => <a href={href} key={href}>{label}</a>)}
  </nav>;
}