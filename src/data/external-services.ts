export const externalServices = [
  {
    name: 'EMIS',
    href: 'https://emis.kemenag.go.id',
    icon: 'emis',
    ariaLabel: 'Buka EMIS Kemenag',
    description: 'Sistem pendataan pendidikan Kemenag'
  },
  {
    name: 'VERVAL PD',
    href: 'https://vervalpd.data.kemdikbud.go.id',
    icon: 'verval',
    ariaLabel: 'Buka Verval PD',
    description: 'Validasi data peserta didik nasional'
  },
  {
    name: 'SIMPATIKA',
    href: 'https://simpatika.kemenag.go.id',
    icon: 'simpatika',
    ariaLabel: 'Buka Simpatika',
    description: 'Layanan kepegawaian guru Madrasah'
  },
  {
    name: 'Cek NISN',
    href: 'https://nisn.data.kemdikbud.go.id',
    icon: 'nisn',
    ariaLabel: 'Cek NISN',
    description: 'Pencarian Nomor Induk Siswa Nasional'
  },
  {
    name: 'RDM',
    href: 'https://rdm.ma-malnukananga.sch.id',
    icon: 'rdm',
    ariaLabel: 'Rapor Digital Madrasah',
    description: 'Akses rapor digital madrasah'
  }
] as const;

export type ExternalService = (typeof externalServices)[number];
