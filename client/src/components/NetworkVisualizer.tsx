import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { NetworkNode, Relation } from '@/lib/NeuralNetworkUtils';

interface NetworkVisualizerProps {
  mode: 'simple' | 'detailed' | '3d';
  userNetworks: (NetworkNode | null)[][][];
  systemNetworks: (NetworkNode | null)[][][];
  activatedNodes: NetworkNode[];
  relations: Relation[];
  bidirectionalRelations: Relation[];
  showRelations: boolean;
  onNodeClick: (node: NetworkNode) => void;
}

const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({
  mode,
  userNetworks,
  systemNetworks,
  activatedNodes,
  relations,
  bidirectionalRelations,
  showRelations,
  onNodeClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodeObjectsRef = useRef<THREE.Mesh[]>([]);
  const nodeDataRef = useRef<NetworkNode[]>([]);
  const lineObjectsRef = useRef<THREE.Line[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    if (mode === '3d') {
      initThreeJS();
      return () => {
        if (rendererRef.current) {
          rendererRef.current.dispose();
          controlsRef.current?.dispose();
          while(sceneRef.current?.children.length) {
            const obj = sceneRef.current.children[0];
            sceneRef.current.remove(obj);
          }
        }
      };
    }
  }, [mode]);

  useEffect(() => {
    if (mode === '3d') {
      updateNetwork3D();
    }
  }, [userNetworks, systemNetworks, activatedNodes, mode, showRelations]);

  // 3D görselleştirme için üç.js kurulumu
  const initThreeJS = () => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // dark:bg-gray-900
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 20;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window resize handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  // 3D Ağ güncellemesi
  const updateNetwork3D = () => {
    if (!sceneRef.current || !mode === '3d') return;

    // Clear previous objects
    nodeObjectsRef.current.forEach(obj => sceneRef.current?.remove(obj));
    lineObjectsRef.current.forEach(obj => sceneRef.current?.remove(obj));
    nodeObjectsRef.current = [];
    lineObjectsRef.current = [];
    nodeDataRef.current = [];

    // Node geometry for user and system nodes
    const userGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const systemGeometry = new THREE.SphereGeometry(0.3, 16, 16);

    // Node materials
    const userMaterial = new THREE.MeshPhongMaterial({ color: 0x4F46E5 }); // primary-600
    const systemMaterial = new THREE.MeshPhongMaterial({ color: 0x8B5CF6 }); // purple-500
    const activatedMaterial = new THREE.MeshPhongMaterial({ color: 0xF97316 }); // orange-500

    // Collect all non-null nodes
    const allUserNodes: NetworkNode[] = [];
    const allSystemNodes: NetworkNode[] = [];

    userNetworks.forEach((layer, layerIdx) => {
      layer.forEach(row => {
        row.forEach(node => {
          if (node) {
            // Position node in 3D space
            const position = node.position || new THREE.Vector3(
              (Math.random() * 2 - 1) * 10,
              (Math.random() * 2 - 1) * 10,
              layerIdx * 5 - 7.5
            );

            // Create node mesh
            const isActivated = activatedNodes.some(aNode => aNode.id === node.id);
            const material = isActivated ? activatedMaterial : userMaterial;
            const nodeMesh = new THREE.Mesh(userGeometry, material);
            nodeMesh.position.copy(position);

            // Save reference to node data
            nodeMesh.userData = { nodeId: node.id };

            sceneRef.current?.add(nodeMesh);
            nodeObjectsRef.current.push(nodeMesh);
            nodeDataRef.current.push(node);
            allUserNodes.push(node);
          }
        });
      });
    });

    systemNetworks.forEach((layer, layerIdx) => {
      layer.forEach(row => {
        row.forEach(node => {
          if (node) {
            // Position node in 3D space
            const position = node.position || new THREE.Vector3(
              (Math.random() * 2 - 1) * 10,
              (Math.random() * 2 - 1) * 10,
              layerIdx * 5 + 2.5  // Offset from user networks
            );

            // Create node mesh
            const isActivated = activatedNodes.some(aNode => aNode.id === node.id);
            const material = isActivated ? activatedMaterial : systemMaterial;            const nodeMesh = new THREE.Mesh(systemGeometry, material);
            nodeMesh.position.copy(position);

            // Save reference to node data
            nodeMesh.userData = { nodeId: node.id };

            sceneRef.current?.add(nodeMesh);
            nodeObjectsRef.current.push(nodeMesh);
            nodeDataRef.current.push(node);
            allSystemNodes.push(node);
          }
        });
      });
    });

    // Add connections if showing relations
    if (showRelations) {
      // Create connections between nodes based on relations
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x6366F1,
        opacity: 0.5,
        transparent: true
      });

      relations.forEach(relation => {
        const sourceNode = allUserNodes.find(node => node.word === relation.userWord);
        const targetNode = allSystemNodes.find(node => node.word === relation.systemWord);

        if (sourceNode && targetNode && sourceNode.position && targetNode.position) {
          const points = [
            new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
            new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z)
          ];

          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, lineMaterial);

          sceneRef.current?.add(line);
          lineObjectsRef.current.push(line);
        }
      });
    }

    // Add raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current) return;

      // Calculate mouse position in normalized device coordinates
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(nodeObjectsRef.current);

      if (intersects.length > 0) {
        const clickedNodeMesh = intersects[0].object as THREE.Mesh;
        const nodeId = clickedNodeMesh.userData.nodeId;
        const nodeData = nodeDataRef.current.find(node => node.id === nodeId);

        if (nodeData) {
          setSelectedNode(nodeData);
          onNodeClick(nodeData);
        }
      }
    };

    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('click', handleCanvasClick);
        return () => canvas.removeEventListener('click', handleCanvasClick);
      }
    }
  };

  // 2D SVG Görselleştirme
  const renderSimpleNetwork = () => {
    // Convert flat network structure for visualization
    const userNodes: NetworkNode[] = [];
    const systemNodes: NetworkNode[] = [];

    // Extract non-null nodes 
    userNetworks.forEach(layer => 
      layer.forEach(row => 
        row.forEach(node => {
          if (node) userNodes.push(node);
        })
      )
    );

    systemNetworks.forEach(layer => 
      layer.forEach(row => 
        row.forEach(node => {
          if (node) systemNodes.push(node);
        })
      )
    );

    // Get most activated nodes for visualization
    const topUserNodes = userNodes
      .sort((a, b) => b.activation - a.activation)
      .slice(0, 10);

    const topSystemNodes = systemNodes
      .sort((a, b) => b.activation - a.activation)
      .slice(0, 10);

    // Create visualization
    const width = 800;
    const height = 400;

    // Eğitilmemiş veya boş ağ kontrolü
    const hasNodes = userNetworks.some(layer => 
      layer.some(row => row.some(node => node !== null))
    ) || systemNetworks.some(layer => 
      layer.some(row => row.some(node => node !== null))
    );

    if (!hasNodes || !relations.length || !activatedNodes.length) {
      return (
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${width} ${height}`} 
          className="visualization-simple"
          ref={svgRef}
        >
          <text x={width/2} y={height/2} textAnchor="middle" className="text-gray-400">
            Henüz ağ eğitilmemiş veya aktif bağlantı yok.
          </text>
        </svg>
      );
    }

    // Generate connection paths
    const connections = showRelations 
      ? topUserNodes.flatMap(userNode => {
          return topSystemNodes.map(systemNode => {
            // Find if relation exists
            const relation = relations.find(r => 
              r.userWord === userNode.word && r.systemWord === systemNode.word
            );

            if (relation) {
              const strength = relation.association / 100;
              return {
                from: userNode,
                to: systemNode,
                strength
              };
            }
            return null;
          }).filter(Boolean);
        })
      : [];

    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        className="visualization-simple"
        ref={svgRef}
      >
        {/* Connection lines */}
        <g className="connections">
          {connections.map((conn, idx) => {
            if (!conn) return null;

            const userX = 100;
            const userY = 100 + (topUserNodes.indexOf(conn.from) * 40);
            const systemX = 400;
            const systemY = 100 + (topSystemNodes.indexOf(conn.to) * 40);

            return (
              <path 
                key={`conn-${idx}`}
                d={`M${userX},${userY} C${userX + 150},${userY - 50} ${systemX - 150},${systemY + 50} ${systemX},${systemY}`}
                stroke="#8B5CF6" 
                strokeWidth={1.5 * (conn.strength || 0.6)}
                strokeOpacity={0.6}
                fill="none"
                className="connection-line"
              />
            );
          })}
        </g>

        {/* User Nodes */}
        <g className="neural-layer" data-layer="1" data-type="user">
          {topUserNodes.map((node, idx) => {
            const y = 100 + (idx * 40);
            const isActivated = activatedNodes.some(n => n.id === node.id);

            return (
              <g key={`user-${idx}`}>
                <circle 
                  cx="100" 
                  cy={y} 
                  r="12" 
                  fill={isActivated ? "#F97316" : "#4F46E5"} 
                  className="neural-node" 
                  data-word={node.word}
                  onClick={() => onNodeClick(node)}
                />
                <text 
                  x="120" 
                  y={y + 4} 
                  fontSize="11" 
                  fill="currentColor" 
                  className="select-none"
                >
                  {node.word}
                </text>
              </g>
            );
          })}
        </g>

        {/* System Nodes */}
        <g className="neural-layer" data-layer="1" data-type="system">
          {topSystemNodes.map((node, idx) => {
            const y = 100 + (idx * 40);
            const isActivated = activatedNodes.some(n => n.id === node.id);

            return (
              <g key={`system-${idx}`}>
                <circle 
                  cx="400" 
                  cy={y} 
                  r="12" 
                  fill={isActivated ? "#F97316" : "#8B5CF6"} 
                  className="neural-node" 
                  data-word={node.word}
                  onClick={() => onNodeClick(node)}
                />
                <text 
                  x="420" 
                  y={y + 4} 
                  fontSize="11" 
                  fill="currentColor" 
                  className="select-none"
                >
                  {node.word}
                </text>
              </g>
            );
          })}
        </g>

        {/* Layer Labels */}
        <g className="neural-layer-labels">
          <text x="100" y="50" fill="currentColor" className="text-xs font-medium text-center">
            Kullanıcı Kelimeler
          </text>
          <text x="400" y="50" fill="currentColor" className="text-xs font-medium text-center">
            Sistem Kelimeler
          </text>
        </g>
      </svg>
    );
  };

  const renderDetailedNetwork = () => {
    // Similar to simple but with more details and more nodes
    // Extract non-null nodes, showing more node details and layer structure
    const allUserNodes: NetworkNode[][] = userNetworks.map(layer => {
      return layer.flatMap(row => row.filter(node => node !== null) as NetworkNode[]);
    });

    const allSystemNodes: NetworkNode[][] = systemNetworks.map(layer => {
      return layer.flatMap(row => row.filter(node => node !== null) as NetworkNode[]);
    });

    // Create 4-layer visualization (up to 4 layers from each network)
    const width = 800;
    const height = 500;

    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        className="visualization-detailed"
        ref={svgRef}
      >
        {/* Draw connections if needed */}
        {showRelations && (
          <g className="connections">
            {relations.slice(0, 50).map((relation, idx) => {
              // Find node positions
              let userNodePos = null;
              let systemNodePos = null;

              // Search for user node
              for (let l = 0; l < allUserNodes.length; l++) {
                const layerNodes = allUserNodes[l];
                const nodeIdx = layerNodes.findIndex(n => n.word === relation.userWord);

                if (nodeIdx >= 0) {
                  const x = 100 + (l * 150);
                  const y = 100 + (nodeIdx * 30);
                  userNodePos = { x, y };
                  break;
                }
              }

              // Search for system node
              for (let l = 0; l < allSystemNodes.length; l++) {
                const layerNodes = allSystemNodes[l];
                const nodeIdx = layerNodes.findIndex(n => n.word === relation.systemWord);

                if (nodeIdx >= 0) {
                  const x = 400 + (l * 150);
                  const y = 100 + (nodeIdx * 30);
                  systemNodePos = { x, y };
                  break;
                }
              }

              if (userNodePos && systemNodePos) {
                return (
                  <path 
                    key={`rel-${idx}`}
                    d={`M${userNodePos.x},${userNodePos.y} C${userNodePos.x + 50},${userNodePos.y} ${systemNodePos.x - 50},${systemNodePos.y} ${systemNodePos.x},${systemNodePos.y}`}
                    stroke="#8B5CF6" 
                    strokeWidth={1.5 * (relation.strength / 100 || 0.6)}
                    strokeOpacity={0.6}
                    fill="none"
                    className="connection-line"
                  />
                );
              }

              return null;
            })}
          </g>
        )}

        {/* Draw user network layers */}
        {allUserNodes.slice(0, 2).map((layerNodes, layerIdx) => {
          const x = 100 + (layerIdx * 150);

          return (
            <g key={`user-layer-${layerIdx}`} className="neural-layer" data-layer={layerIdx} data-type="user">
              {layerNodes.slice(0, 15).map((node, nodeIdx) => {
                const y = 100 + (nodeIdx * 30);
                const isActivated = activatedNodes.some(n => n.id === node.id);

                return (
                  <g key={`user-node-${layerIdx}-${nodeIdx}`}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="10" 
                      fill={isActivated ? "#F97316" : "#4F46E5"} 
                      opacity={node.activation.toFixed(1)} 
                      className="neural-node" 
                      data-word={node.word}
                      onClick={() => onNodeClick(node)}
                    />
                    <text 
                      x={x + 15} 
                      y={y + 4} 
                      fontSize="10" 
                      fill="currentColor" 
                      className="select-none"
                    >
                      {node.word}
                    </text>
                  </g>
                );
              })}

              <text x={x} y="70" fill="currentColor" className="text-xs font-medium">
                Kullanıcı K{layerIdx + 1}
              </text>
            </g>
          );
        })}

        {/* Draw system network layers */}
        {allSystemNodes.slice(0, 2).map((layerNodes, layerIdx) => {
          const x = 400 + (layerIdx * 150);

          return (
            <g key={`system-layer-${layerIdx}`} className="neural-layer" data-layer={layerIdx} data-type="system">
              {layerNodes.slice(0, 15).map((node, nodeIdx) => {
                const y = 100 + (nodeIdx * 30);
                const isActivated = activatedNodes.some(n => n.id === node.id);

                return (
                  <g key={`system-node-${layerIdx}-${nodeIdx}`}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="10" 
                      fill={isActivated ? "#F97316" : "#8B5CF6"} 
                      opacity={node.activation.toFixed(1)} 
                      className="neural-node" 
                      data-word={node.word}
                      onClick={() => onNodeClick(node)}
                    />
                    <text 
                      x={x + 15} 
                      y={y + 4} 
                      fontSize="10" 
                      fill="currentColor" 
                      className="select-none"
                    >
                      {node.word}
                    </text>
                  </g>
                );
              })}

              <text x={x} y="70" fill="currentColor" className="text-xs font-medium">
                Sistem K{layerIdx + 1}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
    >
      {mode === 'simple' && renderSimpleNetwork()}
      {mode === 'detailed' && renderDetailedNetwork()}
      {mode === '3d' && <div className="w-full h-full" />}

      {/* Selected node info panel */}
      {selectedNode && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 p-3 text-sm border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium text-primary-600 dark:text-primary-400">{selectedNode.word}</span>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>Aktivasyon: <span className="font-medium">{selectedNode.activation.toFixed(2)}</span></div>
                <div>Kullanım: <span className="font-medium">{selectedNode.count}</span></div>
                <div>Bağlantı Sayısı: <span className="font-medium">{selectedNode.connections.length}</span></div>
                <div>Derinlik: <span className="font-medium">{selectedNode.depth}</span></div>
              </div>
            </div>
            <button 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setSelectedNode(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2 text-xs">
            <span className="font-medium">Bağlantılar:</span> {selectedNode.parentWords.join(', ') || 'Bağlantı yok'}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkVisualizer;
