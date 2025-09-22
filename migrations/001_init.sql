CREATE TABLE IF NOT EXISTS ppdb (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  nisn TEXT NOT NULL,
  ttl TEXT NOT NULL,
  alamat TEXT NOT NULL,
  kontak TEXT NOT NULL,
  jurusan_pilihan TEXT NOT NULL,
  waktu_daftar TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'Menunggu',
  ip_hash TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ppdb_nisn ON ppdb(nisn);

CREATE TABLE IF NOT EXISTS alumni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  angkatan TEXT NOT NULL,
  pekerjaan TEXT NOT NULL,
  kontak_opsional TEXT,
  dibuat_pada TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS log_absen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  acara_id TEXT NOT NULL,
  siswa_id TEXT NOT NULL,
  waktu_scan TEXT NOT NULL DEFAULT (datetime('now')),
  user_agent TEXT,
  ip_hash TEXT,
  unik_token TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_log_absen_token ON log_absen(unik_token);

CREATE TABLE IF NOT EXISTS arsip (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siswa_id TEXT NOT NULL,
  nama_file TEXT NOT NULL,
  url_rel TEXT NOT NULL,
  tipe_mime TEXT NOT NULL,
  diunggah_pada TEXT NOT NULL DEFAULT (datetime('now'))
);
