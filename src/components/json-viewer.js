import React, { useState } from 'react';
import './json-viewer.css';

/**
 * Componente para mostrar datos en formato JSON con sintaxis coloreada
 */
function JsonViewer({ data, title = "JSON Data", hideDownload = false }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [copiedPath, setCopiedPath] = useState(null);

    const copyToClipboard = (text, path) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedPath(path);
            setTimeout(() => setCopiedPath(null), 2000);
        });
    };

    const renderValue = (value, path = '', depth = 0) => {
        const indent = '  '.repeat(depth);
        
        if (value === null) {
            return <span className="json-null">null</span>;
        }
        
        if (value === undefined) {
            return <span className="json-undefined">undefined</span>;
        }
        
        if (typeof value === 'boolean') {
            return <span className="json-boolean">{value.toString()}</span>;
        }
        
        if (typeof value === 'number') {
            return <span className="json-number">{value}</span>;
        }
        
        if (typeof value === 'string') {
            const isLongString = value.length > 50;
            const displayValue = isLongString ? value.substring(0, 47) + '...' : value;
            return (
                <span className="json-string-container">
                    <span className="json-string">"{displayValue}"</span>
                    {isLongString && (
                        <button 
                            className="json-copy-btn"
                            onClick={() => copyToClipboard(value, path)}
                            title="Copiar valor completo"
                        >
                            {copiedPath === path ? '✓' : '📋'}
                        </button>
                    )}
                </span>
            );
        }
        
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="json-brackets">[]</span>;
            }
            
            return (
                <span className="json-array">
                    <span className="json-brackets">[</span>
                    {value.map((item, index) => (
                        <div key={index} className="json-array-item">
                            {indent}  {renderValue(item, `${path}[${index}]`, depth + 1)}
                            {index < value.length - 1 && <span className="json-comma">,</span>}
                        </div>
                    ))}
                    <div>{indent}<span className="json-brackets">]</span></div>
                </span>
            );
        }
        
        if (typeof value === 'object') {
            const entries = Object.entries(value);
            
            if (entries.length === 0) {
                return <span className="json-brackets">{'{}'}</span>;
            }
            
            return (
                <span className="json-object">
                    <span className="json-brackets">{'{'}</span>
                    {entries.map(([key, val], index) => (
                        <div key={key} className="json-object-entry">
                            {indent}  
                            <span className="json-key">"{key}"</span>
                            <span className="json-colon">: </span>
                            {renderValue(val, `${path}.${key}`, depth + 1)}
                            {index < entries.length - 1 && <span className="json-comma">,</span>}
                        </div>
                    ))}
                    <div>{indent}<span className="json-brackets">{'}'}</span></div>
                </span>
            );
        }
        
        return <span>{String(value)}</span>;
    };

    const downloadJSON = () => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verification-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyAllJSON = () => {
        const jsonString = JSON.stringify(data, null, 2);
        copyToClipboard(jsonString, 'root');
    };

    return (
        <div className="json-viewer-container">
            <div className="json-viewer-header">
                <h3 className="json-viewer-title">
                    {title}
                    <button 
                        className="json-expand-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                        title={isExpanded ? 'Colapsar' : 'Expandir'}
                    >
                        {isExpanded ? '▼' : '▶'}
                    </button>
                </h3>
                <div className="json-viewer-actions">
                    <button 
                        className="json-action-btn"
                        onClick={copyAllJSON}
                        title="Copiar JSON completo"
                    >
                        {copiedPath === 'root' ? '✓ Copiado' : '📋 Copiar'}
                    </button>
                    {!hideDownload && (
                        <button 
                            className="json-action-btn"
                            onClick={downloadJSON}
                            title="Descargar JSON"
                        >
                            💾 Descargar
                        </button>
                    )}
                </div>
            </div>
            
            {isExpanded && (
                <div className="json-viewer-content">
                    <pre className="json-pre">
                        {renderValue(data, 'root')}
                    </pre>
                </div>
            )}
        </div>
    );
}

export default JsonViewer;
