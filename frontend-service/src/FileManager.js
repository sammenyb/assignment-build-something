import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
  Paper,
  Stack,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function FileManager({ token }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await fetch('http://192.168.49.2:30081/files', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
  const res = await fetch('http://192.168.49.2:30081/upload', {
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

  const handleDownload = async (filename) => {
    setErr('');
    try {
      const res = await fetch(`http://192.168.49.2:30081/download/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setErr('Error downloading file');
    }
  };

  const handleDelete = async (filename) => {
    setErr('');
    try {
  const res = await fetch(`http://192.168.49.2:30081/delete/${filename}`, {
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
      <Paper sx={{ p: 3, width: '60vw', mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Files
        </Typography>
        {uploading && <LinearProgress sx={{ mb: 2 }} />}
        <List>
          {files.map(f => (
            <ListItem key={f.minio_key} divider>
              <ListItemText
                primary={
                  <span style={{
                    display: 'inline-block',
                    maxWidth: 400, // or any value that fits your layout
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle'
                  }}>
                    {f.filename}
                  </span>
                }
                secondary={`Owner: ${f.owner}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="download"
                  onClick={() => handleDownload(f.minio_key)}
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(f.filename)}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <Box component="form" onSubmit={handleUpload} sx={{ mt: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              disabled={uploading}
            >
              Choose File
              <input
                type="file"
                hidden
                onChange={e => setSelectedFile(e.target.files[0])}
                required
              />
            </Button>
            <Typography variant="body2">
              {selectedFile ? selectedFile.name : 'No file selected'}
            </Typography>
            <Button
              type="submit"
              variant="contained"
              disabled={uploading || !selectedFile}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </Stack>
        </Box>
        {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
      </Paper>
  );
}

export default FileManager;
