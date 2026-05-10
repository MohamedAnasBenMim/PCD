import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function severityToStatus(severity) {
  switch (severity) {
    case 'Severe':
      return 'urgent';
    case 'Moderate':
      return 'review';
    case 'Mild':
    case 'No DR':
    default:
      return 'completed';
  }
}

function rowToScan(row) {
  return {
    ...row,
    patient: row.patientName || row.patientId,
    status: severityToStatus(row.severity),
  };
}

export async function saveAnalysis({ prediction, upload }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const scanResult = await client.query(
      `insert into scans (
        scan_id,
        patient_id,
        patient_name,
        scan_type,
        eye,
        notes,
        original_filename,
        mime_type,
        file_size,
        severity,
        confidence,
        analyzed_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
      returning id`,
      [
        prediction.scanId,
        prediction.patientId,
        prediction.patientName || upload.patientName || null,
        prediction.scanType || upload.scanType,
        prediction.eye || upload.eye,
        prediction.notes || upload.notes,
        upload.originalFilename,
        upload.mimeType,
        upload.fileSize,
        prediction.severity,
        prediction.confidence,
      ],
    );

    const scanRowId = scanResult.rows[0].id;

    for (const feature of prediction.detectedFeatures || []) {
      await client.query(
        `insert into detected_features (scan_id, name, detected, confidence)
         values ($1, $2, $3, $4)`,
        [scanRowId, feature.name, feature.detected, feature.confidence],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listScans(limit = 50) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 50;

  const result = await pool.query(
    `select
      s.scan_id as "scanId",
      s.patient_id as "patientId",
      s.patient_name as "patientName",
      s.scan_type as "scanType",
      s.eye,
      s.notes,
      s.severity,
      s.confidence,
      to_char(s.analyzed_at, 'YYYY-MM-DD') as date,
      to_char(s.analyzed_at, 'HH24:MI') as time
    from scans s
    order by s.analyzed_at desc
    limit $1`,
    [safeLimit],
  );

  return result.rows.map(rowToScan);
}

export async function getAnalysis(scanId) {
  const result = await pool.query(
    `select
      s.scan_id as "scanId",
      s.patient_id as "patientId",
      s.patient_name as "patientName",
      s.scan_type as "scanType",
      s.eye,
      s.notes,
      s.severity,
      s.confidence,
      to_char(s.analyzed_at, 'YYYY-MM-DD') as date,
      to_char(s.analyzed_at, 'HH24:MI') as time,
      coalesce(
        json_agg(
          json_build_object(
            'name', f.name,
            'detected', f.detected,
            'confidence', f.confidence
          )
        ) filter (where f.id is not null),
        '[]'
      ) as "detectedFeatures"
    from scans s
    left join detected_features f on f.scan_id = s.id
    where s.scan_id = $1
    group by s.id`,
    [scanId],
  );

  return result.rows[0] || null;
}

export async function createUser({ email, password_hash, first_name, last_name, organization }) {
  const result = await pool.query(
    `insert into users (email, password_hash, first_name, last_name, organization)
     values ($1, $2, $3, $4, $5)
     returning id, email, first_name, last_name, organization, created_at`,
    [email, password_hash, first_name || null, last_name || null, organization || null],
  );

  return result.rows[0];
}

export async function getUserByEmail(email) {
  const result = await pool.query(
    `select id, email, password_hash, first_name, last_name, organization, created_at from users where email = $1`,
    [email],
  );

  return result.rows[0] || null;
}

export async function listUsers() {
  const result = await pool.query(
    `select
      id,
      email,
      first_name as "firstName",
      last_name as "lastName",
      organization,
      created_at as "createdAt"
    from users
    order by created_at desc`,
  );

  return result.rows;
}

export async function getUserById(id) {
  const result = await pool.query(
    `select
      id,
      email,
      first_name as "firstName",
      last_name as "lastName",
      organization,
      created_at as "createdAt"
    from users
    where id = $1`,
    [id],
  );

  return result.rows[0] || null;
}

export async function updateUser(id, { email, password_hash, first_name, last_name, organization }) {
  const result = await pool.query(
    `update users
     set
       email = coalesce($2, email),
       password_hash = coalesce($3, password_hash),
       first_name = $4,
       last_name = $5,
       organization = $6
     where id = $1
     returning
       id,
       email,
       first_name as "firstName",
       last_name as "lastName",
       organization,
       created_at as "createdAt"`,
    [id, email || null, password_hash || null, first_name || null, last_name || null, organization || null],
  );

  return result.rows[0] || null;
}

export async function deleteUser(id) {
  const result = await pool.query(
    `delete from users
     where id = $1
     returning
       id,
       email,
       first_name as "firstName",
       last_name as "lastName",
       organization,
       created_at as "createdAt"`,
    [id],
  );

  return result.rows[0] || null;
}

export async function updateScan(scanId, { patient_id, patient_name, scan_type, eye, notes, severity }) {
  const result = await pool.query(
    `update scans
     set
       patient_id = $2,
       patient_name = $3,
       scan_type = $4,
       eye = $5,
       notes = $6,
       severity = $7
     where scan_id = $1
     returning
       scan_id as "scanId",
       patient_id as "patientId",
       patient_name as "patientName",
       scan_type as "scanType",
       eye,
       notes,
       severity,
       confidence,
       to_char(analyzed_at, 'YYYY-MM-DD') as date,
       to_char(analyzed_at, 'HH24:MI') as time`,
    [scanId, patient_id, patient_name || null, scan_type, eye, notes || null, severity],
  );

  return result.rows[0] ? rowToScan(result.rows[0]) : null;
}

export async function deleteScan(scanId) {
  const result = await pool.query(
    `delete from scans
     where scan_id = $1
     returning
       scan_id as "scanId",
       patient_id as "patientId",
       patient_name as "patientName",
       scan_type as "scanType",
       eye,
       notes,
       severity,
       confidence,
       to_char(analyzed_at, 'YYYY-MM-DD') as date,
       to_char(analyzed_at, 'HH24:MI') as time`,
    [scanId],
  );

  return result.rows[0] ? rowToScan(result.rows[0]) : null;
}
