import React, { useEffect, useState } from 'react';

function FileManager({ token }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await fetch('http://localhost:8001/files', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.info(res);
      if (!res.ok) throw new Error('Could not fetch files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) {
      setErr('Error loading files');
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setErr('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch('http://localhost:8001/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      await fetchFiles();
      setSelectedFile(null);
    } catch (e) {
      setErr('Error uploading file');
    }
    setUploading(false);
  };

  const handleDownload = (filename) => {
    window.open(`http://localhost:8001/download/${filename}?token=${token}`, "_blank");
  };

  const handleDelete = async (filename) => {
    setErr('');
    try {
      const res = await fetch(`http://localhost:8001/delete/${filename}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      await fetchFiles();
    }
    catch (e) {
      setErr('Error deleting file');
    }
  };

  return (
    <div>
      <h3>Files</h3>
      <ul>
      {files.map(f => (
        <li key={f.minio_key}>
          {f.filename} (Owner: {f.owner})
          <button onClick={() => handleDownload(f.minio_key)}>Download</button>
          <button onClick={() => handleDelete(f.filename)}>Delete</button>
        </li>
      ))}
      </ul>
      <form onSubmit={handleUpload} style={{ marginTop: 20 }}>
        <input
          type="file"
          onChange={e => setSelectedFile(e.target.files[0])}
          required
        />
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {err && <p style={{ color: 'red' }}>{err}</p>}
    </div>
  );
}

export default FileManager;
