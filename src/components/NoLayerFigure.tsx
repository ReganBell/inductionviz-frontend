function NoLayerFigure() {
  return (
    <figure className="my-12 mx-auto max-w-2xl">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Full Transformer */}
        <div className="flex flex-col items-center">
          {/* <div className="text-sm font-medium text-neutral-600 mb-4">Full Transformer</div> */}
          <svg viewBox="0 0 200 320" className="w-full max-w-[200px]">
            {/* Token input */}
            <rect x="60" y="10" width="80" height="30" rx="4" fill="#f5f5f5" stroke="#a3a3a3" strokeWidth="1.5" />
            <text x="100" y="30" textAnchor="middle" fontSize="12" fill="#525252" fontFamily="system-ui">token</text>

            {/* Embedding */}
            <line x1="100" y1="40" x2="100" y2="55" stroke="#a3a3a3" strokeWidth="1.5" />
            <rect x="50" y="55" width="100" height="35" rx="6" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
            <text x="100" y="77" textAnchor="middle" fontSize="13" fontWeight="600" fill="#262626" fontFamily="system-ui">Embed</text>

            {/* Transformer Blocks */}
            <line x1="100" y1="90" x2="100" y2="105" stroke="#a3a3a3" strokeWidth="1.5"  />
            <rect x="50" y="105" width="100" height="30" rx="6" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="100" y="125" textAnchor="middle" fontSize="11" fill="#1e40af" fontFamily="system-ui">Block 1</text>

            <line x1="100" y1="135" x2="100" y2="150" stroke="#a3a3a3" strokeWidth="1.5"  />
            <rect x="50" y="150" width="100" height="30" rx="6" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="100" y="170" textAnchor="middle" fontSize="11" fill="#1e40af" fontFamily="system-ui">Block 2</text>

            {/* Ellipsis for more blocks */}
            <text x="100" y="200" textAnchor="middle" fontSize="20" fill="#737373" fontFamily="system-ui">⋮</text>

            <rect x="50" y="210" width="100" height="30" rx="6" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="100" y="230" textAnchor="middle" fontSize="11" fill="#1e40af" fontFamily="system-ui">Block N</text>

            {/* Unembedding */}
            <line x1="100" y1="240" x2="100" y2="255" stroke="#a3a3a3" strokeWidth="1.5" />
            <rect x="50" y="255" width="100" height="35" rx="6" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
            <text x="100" y="277" textAnchor="middle" fontSize="13" fontWeight="600" fill="#262626" fontFamily="system-ui">Unembed</text>

            {/* Output */}
            <line x1="100" y1="290" x2="100" y2="315" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* Arrow marker definition */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#a3a3a3" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Collapsed (No Layers) */}
        <div className="flex flex-col items-center">
          {/* <div className="text-sm font-medium text-neutral-600 mb-4">No Layers</div> */}
          <svg viewBox="0 0 200 320" className="w-full max-w-[200px]">
            {/* Token input */}
            <rect x="60" y="10" width="80" height="30" rx="4" fill="#f5f5f5" stroke="#a3a3a3" strokeWidth="1.5" />
            <text x="100" y="30" textAnchor="middle" fontSize="12" fill="#525252" fontFamily="system-ui">token</text>

            {/* Embedding */}
            <line x1="100" y1="40" x2="100" y2="55" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrowhead1)" />
            <rect x="50" y="55" width="100" height="35" rx="6" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
            <text x="100" y="77" textAnchor="middle" fontSize="13" fontWeight="600" fill="#262626" fontFamily="system-ui">Embed</text>

            {/* Ghosted blocks */}
            <line x1="100" y1="90" x2="100" y2="255" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="4,4" />
            {/* <rect x="50" y="135" width="100" height="75" rx="6" fill="none" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="4,4" /> */}
            {/* <text x="100" y="177" textAnchor="middle" fontSize="11" fill="#a3a3a3" fontStyle="italic" fontFamily="system-ui">removed</text> */}

            {/* Unembedding */}
            {/* <line x1="100" y1="240" x2="100" y2="255" stroke="#a3a3a3" strokeWidth="1.5"  /> */}
            <rect x="50" y="255" width="100" height="35" rx="6" fill="#e5e5e5" stroke="#737373" strokeWidth="2" />
            <text x="100" y="277" textAnchor="middle" fontSize="13" fontWeight="600" fill="#262626" fontFamily="system-ui">Unembed</text>

            {/* Output */}
            <line x1="100" y1="290" x2="100" y2="315" stroke="#a3a3a3" strokeWidth="1.5" markerEnd="url(#arrowhead2)" />

            {/* Arrow marker definition */}
            <defs>
              <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#a3a3a3" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>
      {/* <figcaption className="mt-4 text-sm text-neutral-600 text-center">
        Removing all transformer blocks leaves just the embedding and unembedding matrices — essentially a learned bigram model.
      </figcaption> */}
    </figure>
    );
  }
  
export default NoLayerFigure;