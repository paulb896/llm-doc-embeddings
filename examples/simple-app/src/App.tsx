import React, { useState, useEffect, useRef } from 'react';
import { Remarkable } from 'remarkable';
import './App.css';

const apiUrl = 'http://localhost:3000';

function App() {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const md = new Remarkable();

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${apiUrl}/documents`);
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const formatAsMarkdown = (text: string) =>
    text.replace(/(=+)(.*?)\1/g, (match, equals, content) => {
      const headingLevel = equals.length;
      const heading = '#'.repeat(headingLevel) + ' ' + content.trim() + '\n';
      return heading;
    });

  const handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const aiSearch = () => {
    setIsLoading(true);
    const dbResultLimit = 3;
    fetch(`${apiUrl}/ai-search?searchText=${searchText}&dbResultLimit=${dbResultLimit}`)
      .then(response => response.json())
      .then(data => {
        setResults(data.answer);
      })
      .catch(error => console.error('Error:', error))
      .finally(() => setIsLoading(false));
  };

  const dbSearch = () => {
    setIsLoading(true);
    const dbResultLimit = 3;
    fetch(`${apiUrl}/db-search?searchText=${searchText}&dbResultLimit=${dbResultLimit}`)
      .then(response => response.json())
      .then(data => {
        let resultsString = '';
        data.items.forEach((item: { content: string; path: any; }) => {
          resultsString += `- ${formatAsMarkdown(item.content)} (from: ${item.path})\n`;
        });
        setResults(resultsString);
      })
      .catch(error => console.error('Error:', error))
      .finally(() => setIsLoading(false));
  };

  const handleFileUpload = async () => {
    if (fileInputRef.current?.files?.[0]) {
      setIsLoading(true);
      await uploadFile(fileInputRef.current.files[0]);
      fileInputRef.current.value = '';
      await fetchFiles();
      setIsLoading(false);
    }
  };

  const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${apiUrl}/upload`, {
      method: 'POST',
      body: formData
    })
      .then(response => response.text())
      .then(data => {
        setResults(data);
      })
      .catch(error => console.error('Error:', error));
  };

  const indexDocs = async () => {
    setIsIndexing(true);
    try {
      const response = await fetch(`${apiUrl}/index-docs`);
      const data = await response.json();
      setResults(`Indexing successful: ${data.success}`);
      await fetchFiles();
    } catch (error) {
      console.error('Error indexing documents:', error);
    } finally {
      setIsIndexing(false);
    }
  };

  const getFile = async (fileName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/documents/${fileName}`);
      const data = await response.json();
      setResults(data.content);
    } catch (error) {
      console.error('Error fetching file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      try {
        await fetch(`${apiUrl}/documents/${fileName}`, {
          method: 'DELETE',
        });
        setResults(`Document ${fileName} deleted successfully`);
        await fetchFiles();
      } catch (error) {
        setResults(`Error deleting document: ${error}`);
      }
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">LLM Doc Embeddings AI Search</h1>

      <div className="content-container">
        <div className="search-area">
          <h2 className="area-title">Search</h2>
          <input
            type="text"
            className="search-input"
            placeholder="Enter search text"
            value={searchText}
            onChange={handleSearchTextChange}
          />
          <div className="button-group">
            <button
              className="search-button"
              onClick={aiSearch}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'AI Search'}
            </button>
            <button
              className="search-button"
              onClick={dbSearch}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'DB Search'}
            </button>
          </div>

          <h2 className="area-title">Upload</h2>
          <input
            type="file"
            className="upload-input"
            ref={fileInputRef}
          />
          <button
            className="upload-button"
            onClick={handleFileUpload}
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload Document'}
          </button>

          <h2 className="area-title">Index</h2>
          <button
            className="index-button"
            onClick={indexDocs}
            disabled={isIndexing}
          >
            {isIndexing ? 'Indexing...' : 'Index Documents'}
          </button>

          <h2 className="area-title">Files</h2>
          <ul className="file-list">
            {files.map(file => (
              <li key={file} className="file-item" onClick={() => getFile(file)}>
                <span>{file}</span>
                <button onClick={() => deleteDocument(file)} className="delete-button">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="results-area">
          <h2 className="area-title">Results</h2>
          <div className="results-content" dangerouslySetInnerHTML={{ __html: md.render(formatAsMarkdown(results)) }} />
        </div>
      </div>
    </div>
  );
}

export default App;