const { pool } = require('../config/db');

const KONDISI_VALID = new Set([
  'Baik',
  'Rusak',
  'Hilang',
  'Maintenance'
]);

function angkaPositif(value, fallback, max = 100) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0
    ? Math.min(parsed, max)
    : fallback;
}

async function catatRiwayat(conn, {
  inventaris_id,
  tipe_perubahan,
  keterangan,
  data_sebelum,
  data_sesudah,
  changed_by
}) {
  await conn.query(
    `INSERT INTO inventaris_riwayat
    (
      inventaris_id,
      tipe_perubahan,
      keterangan,
      data_sebelum,
      data_sesudah,
      changed_by
    )
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      inventaris_id,
      tipe_perubahan,
      keterangan || null,
      data_sebelum ? JSON.stringify(data_sebelum) : null,
      data_sesudah ? JSON.stringify(data_sesudah) : null,
      changed_by || null
    ]
  );
}


async function list(req, res) {
  try {

    const {
      kondisi,
      kategori_id,
      ruangan_id,
      search
    } = req.query;

    const page = angkaPositif(req.query.page, 1, 1000000);
    const limit = angkaPositif(req.query.limit, 20, 100);

    const where = [
      'i.deleted_at IS NULL'
    ];

    const params = [];

    if (kondisi) {
      where.push('i.kondisi = ?');
      params.push(kondisi);
    }

    if (kategori_id) {
      where.push('i.kategori_id = ?');
      params.push(kategori_id);
    }

    if (ruangan_id) {
      where.push('i.ruangan_id = ?');
      params.push(ruangan_id);
    }

    if (search) {
      where.push('i.nama_barang LIKE ?');
      params.push(`%${search}%`);
    }

    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT 
        i.*,
        k.nama_kategori,
        r.nama_ruangan
      FROM inventaris i
      LEFT JOIN kategori_barang k
        ON k.id=i.kategori_id
      LEFT JOIN ruangan r
        ON r.id=i.ruangan_id
      WHERE ${where.join(' AND ')}
      ORDER BY i.updated_at DESC
      LIMIT ? OFFSET ?`,
      [
        ...params,
        limit,
        offset
      ]
    );


    const [count] = await pool.query(
      `SELECT COUNT(*) total
      FROM inventaris i
      WHERE ${where.join(' AND ')}`,
      params
    );


    res.json({
      data: rows,
      pagination:{
        page,
        limit,
        total: count[0].total,
        totalPages: Math.ceil(
          count[0].total / limit
        )
      }
    });


  } catch(err){

    console.error(err);

    res.status(500).json({
      message:'Gagal mengambil data inventaris.'
    });

  }
}



async function detail(req,res){

  try{

    const [rows] = await pool.query(
      `SELECT 
        i.*,
        k.nama_kategori,
        r.nama_ruangan
      FROM inventaris i
      LEFT JOIN kategori_barang k
        ON k.id=i.kategori_id
      LEFT JOIN ruangan r
        ON r.id=i.ruangan_id
      WHERE i.id=? 
      AND i.deleted_at IS NULL`,
      [
        req.params.id
      ]
    );


    if(rows.length===0){
      return res.status(404).json({
        message:'Barang tidak ditemukan.'
      });
    }


    res.json(rows[0]);


  }catch(err){

    console.error(err);

    res.status(500).json({
      message:'Gagal mengambil detail barang.'
    });

  }

}



async function riwayat(req,res){

  try{

    const [rows]=await pool.query(
      `SELECT
        ir.*,
        u.nama AS nama_pengubah
      FROM inventaris_riwayat ir
      LEFT JOIN users u
        ON u.id=ir.changed_by
      WHERE ir.inventaris_id=?
      ORDER BY ir.created_at DESC`,
      [
        req.params.id
      ]
    );

    res.json(rows);

  }catch(err){

    console.error(err);

    res.status(500).json({
      message:'Gagal mengambil riwayat.'
    });

  }

}

async function create(req,res){

  const conn = await pool.getConnection();

  try{

    const {
      nama_barang,
      kategori_id,
      jumlah,
      kondisi,
      ruangan_id,
      lokasi_detail,
      catatan,
      tanggal_pendataan,
      sumber
    } = req.body;


    const foto_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;


    if(!nama_barang?.trim() || !tanggal_pendataan){
      return res.status(400).json({
        message:'Nama barang dan tanggal pendataan wajib diisi.'
      });
    }


    if(kondisi && !KONDISI_VALID.has(kondisi)){
      return res.status(400).json({
        message:'Nilai kondisi tidak valid.'
      });
    }


    if(
      jumlah !== undefined &&
      Number(jumlah) < 0
    ){
      return res.status(400).json({
        message:'Jumlah tidak boleh negatif.'
      });
    }


    await conn.beginTransaction();


    const [result] = await conn.query(
      `INSERT INTO inventaris
      (
        nama_barang,
        kategori_id,
        jumlah,
        kondisi,
        ruangan_id,
        lokasi_detail,
        foto_url,
        catatan,
        tanggal_pendataan,
        sumber,
        created_by
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      [
        nama_barang.trim(),
        kategori_id || null,
        jumlah ?? 0,
        kondisi || 'Baik',
        ruangan_id || null,
        lokasi_detail || null,
        foto_url,
        catatan || null,
        tanggal_pendataan,
        sumber || 'Manual',
        req.user.id
      ]
    );


    await catatRiwayat(conn,{
      inventaris_id:result.insertId,
      tipe_perubahan:'Ditambahkan',
      keterangan:
        `Barang "${nama_barang}" ditambahkan dengan jumlah ${jumlah ?? 0}.`,
      data_sesudah:req.body,
      changed_by:req.user.id
    });


    await conn.commit();


    res.status(201).json({
      id:result.insertId,
      message:'Barang berhasil ditambahkan.'
    });


  }catch(err){

    await conn.rollback();

    console.error(err);

    res.status(500).json({
      message:'Gagal menambahkan barang.'
    });

  }finally{

    conn.release();

  }

}



async function update(req,res){

  const conn = await pool.getConnection();


  try{

    const {id}=req.params;


    const [rows]=await conn.query(
      `SELECT *
      FROM inventaris
      WHERE id=?
      AND deleted_at IS NULL`,
      [id]
    );


    if(rows.length===0){

      return res.status(404).json({
        message:'Barang tidak ditemukan.'
      });

    }


    const before=rows[0];


    const {
      nama_barang,
      kategori_id,
      jumlah,
      kondisi,
      ruangan_id,
      lokasi_detail,
      catatan,
      tanggal_pendataan
    }=req.body;


    const foto_url=req.file
      ? `/uploads/${req.file.filename}`
      : before.foto_url;



    if(jumlah !== undefined && Number(jumlah)<0){

      return res.status(400).json({
        message:'Jumlah tidak boleh negatif.'
      });

    }



    await conn.beginTransaction();



    await conn.query(
      `UPDATE inventaris SET

      nama_barang=?,
      kategori_id=?,
      jumlah=?,
      kondisi=?,
      ruangan_id=?,
      lokasi_detail=?,
      foto_url=?,
      catatan=?,
      tanggal_pendataan=?

      WHERE id=?`,
      [
        nama_barang ?? before.nama_barang,
        kategori_id ?? before.kategori_id,
        jumlah ?? before.jumlah,
        kondisi ?? before.kondisi,
        ruangan_id ?? before.ruangan_id,
        lokasi_detail ?? before.lokasi_detail,
        foto_url,
        catatan ?? before.catatan,
        tanggal_pendataan ?? before.tanggal_pendataan,
        id
      ]
    );



    let tipe='Diperbarui';

    let keterangan=
      `Data barang "${before.nama_barang}" diperbarui.`;



    if(
      jumlah !== undefined &&
      Number(jumlah)!==Number(before.jumlah)
    ){

      const selisih =
        Number(jumlah)-Number(before.jumlah);


      tipe='Jumlah Berubah';


      if(selisih < 0){

        keterangan =
          `Jumlah berkurang ${Math.abs(selisih)}. Dari ${before.jumlah} menjadi ${jumlah}.`;

      }else{

        keterangan =
          `Jumlah bertambah ${selisih}. Dari ${before.jumlah} menjadi ${jumlah}.`;

      }

    }



    if(
      kondisi &&
      kondisi !== before.kondisi
    ){

      tipe='Kondisi Berubah';

      keterangan =
        `Kondisi berubah dari ${before.kondisi} menjadi ${kondisi}.`;

    }



    await catatRiwayat(conn,{
      inventaris_id:id,
      tipe_perubahan:tipe,
      keterangan,
      data_sebelum:before,
      data_sesudah:req.body,
      changed_by:req.user.id
    });



    await conn.commit();


    res.json({
      message:'Barang berhasil diperbarui.'
    });



  }catch(err){

    await conn.rollback();

    console.error(err);

    res.status(500).json({
      message:'Gagal memperbarui barang.'
    });


  }finally{

    conn.release();

  }

}



async function remove(req,res){

  const conn=await pool.getConnection();


  try{

    const {id}=req.params;


    const [rows]=await conn.query(
      `SELECT *
      FROM inventaris
      WHERE id=?
      AND deleted_at IS NULL`,
      [id]
    );


    if(rows.length===0){

      return res.status(404).json({
        message:'Barang tidak ditemukan.'
      });

    }



    await conn.beginTransaction();


    await conn.query(
      `UPDATE inventaris
      SET deleted_at=NOW()
      WHERE id=?`,
      [id]
    );



    await catatRiwayat(conn,{
      inventaris_id:id,
      tipe_perubahan:'Dihapus',
      keterangan:
        `Barang "${rows[0].nama_barang}" dihapus.`,
      data_sebelum:rows[0],
      changed_by:req.user.id
    });



    await conn.commit();


    res.json({
      message:'Barang berhasil dihapus.'
    });


  }catch(err){

    await conn.rollback();

    console.error(err);

    res.status(500).json({
      message:'Gagal menghapus barang.'
    });


  }finally{

    conn.release();

  }

}



async function ringkasan(req,res){

  try{


    const [[total]]=await pool.query(
      `SELECT COUNT(*) jumlah
      FROM inventaris
      WHERE deleted_at IS NULL`
    );


    const [rows]=await pool.query(
      `SELECT kondisi,COUNT(*) jumlah
      FROM inventaris
      WHERE deleted_at IS NULL
      GROUP BY kondisi`
    );


    const kondisi={
      Baik:0,
      Rusak:0,
      Hilang:0,
      Maintenance:0
    };


    rows.forEach(r=>{
      kondisi[r.kondisi]=r.jumlah;
    });


    res.json({

      total_inventaris:total.jumlah,
      ready:kondisi.Baik,
      rusak_hilang:
        kondisi.Rusak+kondisi.Hilang,
      maintenance:kondisi.Maintenance,
      detail_kondisi:kondisi

    });


  }catch(err){

    console.error(err);

    res.status(500).json({
      message:'Gagal mengambil ringkasan.'
    });

  }

}



async function aktivitasTerbaru(req,res){

  try{


    const limit=
      angkaPositif(
        req.query.limit,
        8,
        100
      );


    const [rows]=await pool.query(
      `SELECT
        ir.id,
        ir.tipe_perubahan,
        ir.keterangan,
        ir.created_at,
        i.nama_barang,
        u.nama nama_pengubah

      FROM inventaris_riwayat ir

      JOIN inventaris i
      ON i.id=ir.inventaris_id

      LEFT JOIN users u
      ON u.id=ir.changed_by

      ORDER BY ir.created_at DESC

      LIMIT ?`,
      [limit]
    );


    res.json(rows);


  }catch(err){

    console.error(err);

    res.status(500).json({
      message:'Gagal mengambil aktivitas.'
    });

  }

}

module.exports={
  list,
  detail,
  riwayat,
  create,
  update,
  remove,
  ringkasan,
  aktivitasTerbaru
};