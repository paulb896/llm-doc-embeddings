import React, { JSX, useEffect, useRef, useState } from 'react';
import { Remarkable } from 'remarkable';
import './App.css';

const apiUrl = 'http://localhost:3000';

function App() {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<JSX.Element | string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(`${apiUrl}/documents`);
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, []);

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

  const uploadFile = (file: File) => { // Change the parameter type to File
    const formData = new FormData();
    formData.append('file', file);

    fetch(`${apiUrl}/upload`, {
      method: 'POST',
      body: formData
    })
      .then(response => response.text())
      .then(data => {
        setResults(data);
      })
      .catch(error => console.error('Error:', error));
  };

  const handleFileUpload = () => {
    if (fileInputRef.current?.files?.[0]) {
      uploadFile(fileInputRef.current.files[0]);
    }
  };

  const indexDocs = async () => {
    setIsIndexing(true); // Set indexing to true
    try {
      const response = await fetch(`${apiUrl}/index-docs`);
      const data = await response.json();
      setResults(`Indexing successful: ${data.success}`);
    } catch (error) {
      console.error('Error indexing documents:', error);
    } finally {
      setIsIndexing(false); // Set indexing to false after request completes
    }
  };

  const formatAsMarkdown = (text: string) => {
    const formattedText = text.replace(/==(.*?)==/g, '## $1\n');
    return formattedText;
  };

  const md = new Remarkable();

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
            ref={fileInputRef} // Connect the ref to the file input
          />
          <button
            className="upload-button"
            onClick={handleFileUpload}
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload Document'}
          </button>

          <h2 className="area-title">Indexed Files</h2>
          <p>All of the documents that have been indexed, click on the title below to view the file contents.</p>
          <ul className="file-list">
            {files.map(file => (
              <li key={file} onClick={() => getFile(file)} className="file-item">
                {file}
              </li>
            ))}
          </ul>

          <h2 className="area-title">Index</h2>
          <button
            className="index-button"
            onClick={indexDocs}
            disabled={isIndexing}
          >
            {isIndexing ? 'Indexing...' : 'Index Documents'}
          </button>
        </div>

        <div className="results-area">
          <h2 className="area-title">Results</h2>
          <div
            className="results-content"
            dangerouslySetInnerHTML={{ __html: md.render(formatAsMarkdown(results.toString())) }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;