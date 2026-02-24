import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  ProgressBar,
  ListGroup,
  Alert,
  Badge,
} from "react-bootstrap";
import type {
  FileInfo,
  ConversionProgress,
  ConversionResult,
  AppState,
} from "./types";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    files: [],
    subject: "",
    city: "",
    teacher: "",
    outputFolder: "",
    coverArt: null,
    isConverting: false,
    progress: null,
    results: [],
    error: null,
  });

  useEffect(() => {
    const unsubProgress = window.electronAPI.onConversionProgress((progress) =>
      setState((p) => ({ ...p, progress })),
    );
    const unsubComplete = window.electronAPI.onConversionComplete((data) =>
      setState((p) => ({
        ...p,
        isConverting: false,
        progress: null,
        results: data.results,
      })),
    );
    return () => {
      unsubProgress();
      unsubComplete();
    };
  }, []);

  const handleSelectFiles = useCallback(async () => {
    const files = await window.electronAPI.selectWavFiles();
    if (files.length > 0)
      setState((p) => ({ ...p, files: [...p.files, ...files], error: null }));
  }, []);

  const handleSelectCoverArt = useCallback(async () => {
    const coverArt = await window.electronAPI.selectCoverArt();
    if (coverArt) setState((p) => ({ ...p, coverArt, error: null }));
  }, []);

  const handleSelectOutputFolder = useCallback(async () => {
    const folder = await window.electronAPI.selectOutputFolder();
    if (folder) setState((p) => ({ ...p, outputFolder: folder, error: null }));
  }, []);

  const handleRemoveFile = useCallback(
    (index: number) =>
      setState((p) => ({ ...p, files: p.files.filter((_, i) => i !== index) })),
    [],
  );
  const handleRemoveCoverArt = useCallback(
    () => setState((p) => ({ ...p, coverArt: null })),
    [],
  );
  const handleClearFiles = useCallback(
    () => setState((p) => ({ ...p, files: [], results: [] })),
    [],
  );

  const handleConvert = useCallback(async () => {
    const { files, subject, city, teacher, outputFolder, coverArt } = state;
    if (files.length === 0) {
      setState((p) => ({ ...p, error: "Please select at least one WAV file" }));
      return;
    }
    if (!subject || !city || !teacher) {
      setState((p) => ({ ...p, error: "Please fill in all required fields" }));
      return;
    }
    if (!outputFolder) {
      setState((p) => ({ ...p, error: "Please select an output folder" }));
      return;
    }
    setState((p) => ({
      ...p,
      isConverting: true,
      error: null,
      results: [],
      progress: null,
    }));
    try {
      await window.electronAPI.convertFiles({
        files,
        subject,
        city,
        teacher,
        outputFolder,
        coverArtPath: coverArt?.path,
      });
    } catch (err) {
      setState((p) => ({
        ...p,
        isConverting: false,
        error: err instanceof Error ? err.message : "Conversion failed",
      }));
    }
  }, [state]);

  const handleOpenOutputFolder = useCallback(async () => {
    if (state.outputFolder)
      await window.electronAPI.openFolder(state.outputFolder);
  }, [state.outputFolder]);
  const handleReset = useCallback(() => {
    setState({
      files: [],
      subject: "",
      city: "",
      teacher: "",
      outputFolder: "",
      coverArt: null,
      isConverting: false,
      progress: null,
      results: [],
      error: null,
    });
  }, []);

  const successCount = state.results.filter((r) => r.success).length;
  const failCount = state.results.filter((r) => !r.success).length;

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <nav className="navbar navbar-dark bg-primary">
        <Container>
          <span className="navbar-brand mb-0 h1">
            <i className="bi bi-music-note-beamed me-2"></i>
            RBTC Audio Converter
          </span>
        </Container>
      </nav>

      {/* Main Content */}
      <Container className="py-4 flex-grow-1">
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Error Alert */}
            {state.error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setState((p) => ({ ...p, error: null }))}
              >
                <Alert.Heading>Error</Alert.Heading>
                <p className="mb-0">{state.error}</p>
              </Alert>
            )}

            {/* Results View */}
            {state.results.length > 0 && !state.isConverting && (
              <Card className="mb-4">
                <Card.Body className="text-center">
                  <div
                    className={`display-1 mb-3 ${failCount === 0 ? "text-success" : "text-warning"}`}
                  >
                    {failCount === 0 ? "✓" : "⚠"}
                  </div>
                  <h2>Conversion Complete!</h2>
                  <p className="text-muted">
                    Successfully converted:{" "}
                    <Badge bg="success">{successCount}</Badge>
                    {failCount > 0 && (
                      <>
                        {" "}
                        Failed: <Badge bg="danger">{failCount}</Badge>
                      </>
                    )}
                  </p>
                  <p className="text-muted small">
                    Output: {state.outputFolder}
                  </p>
                  <div className="d-flex gap-2 justify-content-center mb-4">
                    <Button variant="primary" onClick={handleOpenOutputFolder}>
                      <i className="bi bi-folder2-open me-2"></i>Open Output
                      Folder
                    </Button>
                    <Button variant="outline-secondary" onClick={handleReset}>
                      Start New Conversion
                    </Button>
                  </div>
                  <hr />
                  <h5>Conversion Details</h5>
                  <ListGroup variant="flush">
                    {state.results.map((result, idx) => (
                      <ListGroup.Item
                        key={idx}
                        className="d-flex align-items-center gap-2"
                      >
                        {result.success ? (
                          <span className="text-success">✓</span>
                        ) : (
                          <span className="text-danger">✗</span>
                        )}
                        <span>{result.inputFile}</span>
                        {result.success && (
                          <>
                            <span className="text-muted">→</span>
                            <span className="text-success">
                              {result.outputFile}
                            </span>
                          </>
                        )}
                        {result.error && (
                          <span className="text-danger">({result.error})</span>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            )}

            {/* Progress View */}
            {state.isConverting && state.progress && (
              <Card className="mb-4">
                <Card.Body>
                  <h4>Converting...</h4>
                  <p>
                    File {state.progress.currentFile} of{" "}
                    {state.progress.totalFiles}:{" "}
                    <strong>{state.progress.fileName}</strong>
                  </p>
                  <p className="text-muted small">
                    Status:{" "}
                    {state.progress.status === "converting"
                      ? "Converting to MP3..."
                      : "Adding metadata..."}
                  </p>
                  <ProgressBar
                    animated
                    now={Math.round(
                      ((state.progress.currentFile - 1) /
                        state.progress.totalFiles) *
                        100 +
                        state.progress.fileProgress / state.progress.totalFiles,
                    )}
                    label={`${Math.round(((state.progress.currentFile - 1) / state.progress.totalFiles) * 100 + state.progress.fileProgress / state.progress.totalFiles)}%`}
                    className="mb-2"
                  />
                  <ProgressBar
                    variant="info"
                    now={Math.round(state.progress.fileProgress)}
                    label={`File: ${Math.round(state.progress.fileProgress)}%`}
                    style={{ height: "10px" }}
                  />
                </Card.Body>
              </Card>
            )}

            {/* Main Form */}
            {!state.isConverting && state.results.length === 0 && (
              <>
                {/* File Selection */}
                <Card className="mb-3">
                  <Card.Header>1. Select WAV Files</Card.Header>
                  <Card.Body>
                    <div className="d-flex gap-2 mb-3">
                      <Button variant="primary" onClick={handleSelectFiles}>
                        <i className="bi bi-file-earmark-plus me-2"></i>Select
                        WAV Files
                      </Button>
                      {state.files.length > 0 && (
                        <Button
                          variant="outline-danger"
                          onClick={handleClearFiles}
                        >
                          <i className="bi bi-trash me-2"></i>Clear All
                        </Button>
                      )}
                    </div>
                    {state.files.length > 0 ? (
                      <ListGroup style={{ maxHeight: 200, overflow: "auto" }}>
                        {state.files.map((file, index) => (
                          <ListGroup.Item
                            key={index}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <i className="bi bi-file-earmark-music me-2"></i>
                              <span
                                className="text-truncate"
                                style={{
                                  maxWidth: 350,
                                  display: "inline-block",
                                }}
                              >
                                {file.name}
                              </span>
                              {file.size && (
                                <span className="text-muted ms-2">
                                  ({formatFileSize(file.size)})
                                </span>
                              )}
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <i className="bi bi-x"></i>
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <p className="text-muted mb-0">No files selected</p>
                    )}
                  </Card.Body>
                </Card>

                {/* Metadata Form */}
                <Card className="mb-3">
                  <Card.Header>2. Enter Metadata</Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Subject (Fachkürzel){" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., BWL"
                          value={state.subject}
                          onChange={(e) =>
                            setState((p) => ({ ...p, subject: e.target.value }))
                          }
                        />
                        <Form.Text className="text-muted">
                          e.g., BWL, RE, WI
                        </Form.Text>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          City <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., Berlin"
                          value={state.city}
                          onChange={(e) =>
                            setState((p) => ({ ...p, city: e.target.value }))
                          }
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Teacher (Lehrerkürzel){" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., MM"
                          value={state.teacher}
                          onChange={(e) =>
                            setState((p) => ({ ...p, teacher: e.target.value }))
                          }
                        />
                        <Form.Text className="text-muted">
                          Teacher abbreviation for metadata
                        </Form.Text>
                      </Form.Group>
                    </Form>
                  </Card.Body>
                </Card>

                {/* Cover Art */}
                <Card className="mb-3">
                  <Card.Header>3. Cover Art (Optional)</Card.Header>
                  <Card.Body>
                    <div className="d-flex gap-2 mb-2">
                      <Button
                        variant="outline-secondary"
                        onClick={handleSelectCoverArt}
                      >
                        <i className="bi bi-image me-2"></i>Select Cover Art
                      </Button>
                      {state.coverArt && (
                        <Button
                          variant="outline-danger"
                          onClick={handleRemoveCoverArt}
                        >
                          <i className="bi bi-trash me-2"></i>Remove
                        </Button>
                      )}
                    </div>
                    {state.coverArt ? (
                      <p className="mb-0">
                        <i className="bi bi-image me-2"></i>
                        {state.coverArt.name}
                      </p>
                    ) : (
                      <p className="text-muted mb-0">No cover art selected</p>
                    )}
                  </Card.Body>
                </Card>

                {/* Output Folder */}
                <Card className="mb-3">
                  <Card.Header>4. Output Folder</Card.Header>
                  <Card.Body>
                    <Button
                      variant="outline-secondary"
                      onClick={handleSelectOutputFolder}
                      className="mb-2"
                    >
                      <i className="bi bi-folder2-open me-2"></i>Select Output
                      Folder
                    </Button>
                    {state.outputFolder ? (
                      <p className="mb-0">
                        <i className="bi bi-folder me-2"></i>
                        {state.outputFolder}
                      </p>
                    ) : (
                      <p className="text-muted mb-0">
                        No output folder selected
                      </p>
                    )}
                  </Card.Body>
                </Card>

                {/* Convert Button */}
                <div className="d-grid">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleConvert}
                    disabled={
                      state.files.length === 0 ||
                      !state.subject ||
                      !state.city ||
                      !state.teacher ||
                      !state.outputFolder
                    }
                  >
                    <i className="bi bi-play-circle me-2"></i>
                    Convert {state.files.length} File
                    {state.files.length !== 1 ? "s" : ""} to MP3
                  </Button>
                </div>
              </>
            )}
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <footer className="bg-light py-3 text-center">
        <small className="text-muted">
          RBTC Audio Converter - WAV to MP3 with metadata
        </small>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
