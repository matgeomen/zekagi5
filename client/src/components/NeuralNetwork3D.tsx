import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { NetworkNode, Relation } from '@/lib/NeuralNetworkUtils';
import { useTheme } from '@/contexts/ThemeContext';

interface NeuralNetwork3DProps {
  userNetworks: (NetworkNode | null)[][][];
  systemNetworks: (NetworkNode | null)[][][];
  relations: Relation[];
  bidirectionalRelations: Relation[];
  activatedNodes: {
    layer: number;
    row: number;
    col: number;
    type: 'user' | 'system';
  }[];
  onNodeClick?: (node: NetworkNode, layer: number, row: number, col: number, type: 'user' | 'system') => void;
}

export default function NeuralNetwork3D({
  userNetworks,
  systemNetworks,
  relations,
  bidirectionalRelations,
  activatedNodes,
  onNodeClick
}: NeuralNetwork3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();
  const [hoveredNode, setHoveredNode] = useState<{
    node: NetworkNode;
    x: number;
    y: number;
  } | null>(null);
  
  // Scene state with references for cleanup
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    controls?: OrbitControls;
    nodeObjects?: THREE.Object3D[];
    relationLines?: THREE.Line[];
    raycaster?: THREE.Raycaster;
    animationFrameId?: number;
  }>({
    nodeObjects: [],
    relationLines: []
  });
  
  // Renkleri belirle
  const colors = {
    background: isDarkMode ? 0x111827 : 0xf9fafb,
    userNode: isDarkMode ? 0x3b82f6 : 0x3b82f6,
    systemNode: isDarkMode ? 0x10b981 : 0x10b981,
    activatedNode: 0xef4444,
    relation: isDarkMode ? 0x9ca3af : 0x6b7280,
    bidirectionalRelation: isDarkMode ? 0xfbbf24 : 0xd97706,
    text: isDarkMode ? 0xffffff : 0x000000
  };

  // Initialize scene only once
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Dimension
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.background);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 15;
    camera.position.x = 15;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Add to refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      nodeObjects: [],
      relationLines: [],
      raycaster
    };
    
    // Mouse move handler for hover
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;
    };
    
    // Click handler for nodes
    const handleClick = () => {
      if (!sceneRef.current.raycaster || !sceneRef.current.camera || !sceneRef.current.scene || !onNodeClick) return;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Check if it's a node
        if (object.userData.isNode && object.userData.nodeData) {
          const { nodeData, layer, row, col, type } = object.userData;
          onNodeClick(nodeData, layer, row, col, type);
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    
    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current.camera || !sceneRef.current.renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      if (!sceneRef.current.controls || !sceneRef.current.renderer || !sceneRef.current.scene || !sceneRef.current.camera) return;
      
      sceneRef.current.controls.update();
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      
      // Raycasting for hover
      if (sceneRef.current.raycaster) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Reset all nodes to original color
        scene.traverse((object) => {
          if (object.userData.isNode && object.userData.originalColor) {
            (object as THREE.Mesh).material = new THREE.MeshLambertMaterial({
              color: object.userData.activated ? colors.activatedNode : object.userData.originalColor
            });
          }
        });
        
        // Set hovered node
        if (intersects.length > 0) {
          const object = intersects[0].object;
          
          if (object.userData.isNode && object.userData.nodeData) {
            // Highlight hovered node
            (object as THREE.Mesh).material = new THREE.MeshLambertMaterial({
              color: 0xff00ff, // Highlight color
              emissive: 0x440044
            });
            
            // Store hovered node for tooltip
            const worldPos = new THREE.Vector3();
            object.getWorldPosition(worldPos);
            
            const vector = worldPos.clone();
            vector.project(camera);
            
            const x = (vector.x * 0.5 + 0.5) * width;
            const y = -(vector.y * 0.5 - 0.5) * height;
            
            setHoveredNode({
              node: object.userData.nodeData,
              x,
              y
            });
          } else {
            setHoveredNode(null);
          }
        } else {
          setHoveredNode(null);
        }
      }
      
      sceneRef.current.animationFrameId = requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    sceneRef.current.animationFrameId = animationId;
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current.animationFrameId) {
        cancelAnimationFrame(sceneRef.current.animationFrameId);
      }
      
      if (sceneRef.current.renderer && containerRef.current) {
        containerRef.current.removeChild(sceneRef.current.renderer.domElement);
      }
      
      // Dispose of all geometries and materials
      if (sceneRef.current.scene) {
        sceneRef.current.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, []);
  
  // Update scene when data changes
  useEffect(() => {
    if (!sceneRef.current.scene || !sceneRef.current.camera) return;
    
    const { scene } = sceneRef.current;
    
    // Clear previous nodes and relations
    if (sceneRef.current.nodeObjects) {
      sceneRef.current.nodeObjects.forEach(obj => {
        scene.remove(obj);
      });
    }
    
    if (sceneRef.current.relationLines) {
      sceneRef.current.relationLines.forEach(line => {
        scene.remove(line);
      });
    }
    
    sceneRef.current.nodeObjects = [];
    sceneRef.current.relationLines = [];
    
    // Store node positions for relations
    const nodePositions = new Map<string, THREE.Vector3>();
    
    // Determine space between layers
    const layerSpacing = 10;
    const layerOffsetX = -(userNetworks.length * layerSpacing) / 2;
    
    // Create user network nodes
    userNetworks.forEach((layer, layerIndex) => {
      layer.forEach((row, rowIndex) => {
        row.forEach((node, colIndex) => {
          if (node) {
            const x = layerOffsetX + layerIndex * layerSpacing;
            const y = rowIndex * 1.2 - layer.length / 2;
            const z = colIndex * 1.2 - row.length / 2;
            
            // Check if node is activated
            const isActivated = activatedNodes.some(
              an => an.layer === layerIndex && an.row === rowIndex && an.col === colIndex && an.type === 'user'
            );
            
            const nodeGeometry = new THREE.SphereGeometry(isActivated ? 0.4 : 0.3, 16, 16);
            const nodeMaterial = new THREE.MeshLambertMaterial({
              color: isActivated ? colors.activatedNode : colors.userNode
            });
            
            const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            nodeMesh.position.set(x, y, z);
            
            // Store metadata for interaction
            nodeMesh.userData = {
              isNode: true,
              nodeData: node,
              layer: layerIndex,
              row: rowIndex,
              col: colIndex,
              type: 'user',
              originalColor: colors.userNode,
              activated: isActivated
            };
            
            scene.add(nodeMesh);
            sceneRef.current.nodeObjects?.push(nodeMesh);
            
            // Store position for relations
            nodePositions.set(node.id, new THREE.Vector3(x, y, z));
          }
        });
      });
    });
    
    // Create system network nodes
    systemNetworks.forEach((layer, layerIndex) => {
      layer.forEach((row, rowIndex) => {
        row.forEach((node, colIndex) => {
          if (node) {
            const x = layerOffsetX + (userNetworks.length + layerIndex) * layerSpacing;
            const y = rowIndex * 1.2 - layer.length / 2;
            const z = colIndex * 1.2 - row.length / 2;
            
            // Check if node is activated
            const isActivated = activatedNodes.some(
              an => an.layer === layerIndex && an.row === rowIndex && an.col === colIndex && an.type === 'system'
            );
            
            const nodeGeometry = new THREE.SphereGeometry(isActivated ? 0.4 : 0.3, 16, 16);
            const nodeMaterial = new THREE.MeshLambertMaterial({
              color: isActivated ? colors.activatedNode : colors.systemNode
            });
            
            const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            nodeMesh.position.set(x, y, z);
            
            // Store metadata for interaction
            nodeMesh.userData = {
              isNode: true,
              nodeData: node,
              layer: layerIndex,
              row: rowIndex,
              col: colIndex,
              type: 'system',
              originalColor: colors.systemNode,
              activated: isActivated
            };
            
            scene.add(nodeMesh);
            sceneRef.current.nodeObjects?.push(nodeMesh);
            
            // Store position for relations
            nodePositions.set(node.id, new THREE.Vector3(x, y, z));
          }
        });
      });
    });
    
    // Active relations filter
    const activeRelations = relations.filter(rel => rel.strength > 30);
    
    // Create relations (connection lines)
    activeRelations.forEach(relation => {
      // Find node objects for both ends
      const userNodePosition = findNodePositionByWord(userNetworks, relation.userWord, nodePositions);
      const systemNodePosition = findNodePositionByWord(systemNetworks, relation.systemWord, nodePositions);
      
      if (userNodePosition && systemNodePosition) {
        const points = [userNodePosition, systemNodePosition];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Line strength based on relation strength
        const lineWidth = Math.max(1, Math.min(5, relation.strength / 30));
        
        const lineMaterial = new THREE.LineBasicMaterial({
          color: colors.relation,
          transparent: true,
          opacity: relation.strength / 100, // Opacity based on strength
          linewidth: lineWidth,
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.userData = {
          relation
        };
        
        scene.add(line);
        sceneRef.current.relationLines?.push(line);
      }
    });
    
    // Create bidirectional relations with different color
    bidirectionalRelations.filter(rel => rel.strength > 40).forEach(relation => {
      // Find node objects for both ends
      const systemNodePosition = findNodePositionByWord(systemNetworks, relation.userWord, nodePositions);
      const userNodePosition = findNodePositionByWord(userNetworks, relation.systemWord, nodePositions);
      
      if (userNodePosition && systemNodePosition) {
        const points = [userNodePosition, systemNodePosition];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Line strength based on relation strength
        const lineWidth = Math.max(1, Math.min(5, relation.strength / 30));
        
        const lineMaterial = new THREE.LineBasicMaterial({
          color: colors.bidirectionalRelation,
          transparent: true,
          opacity: relation.strength / 100, // Opacity based on strength
          linewidth: lineWidth,
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.userData = {
          relation
        };
        
        scene.add(line);
        sceneRef.current.relationLines?.push(line);
      }
    });
  }, [userNetworks, systemNetworks, relations, bidirectionalRelations, activatedNodes, colors.userNode, colors.systemNode, colors.relation, colors.bidirectionalRelation, colors.activatedNode]);
  
  // Helper to find node position by word
  const findNodePositionByWord = (
    networks: (NetworkNode | null)[][][],
    word: string,
    nodePositions: Map<string, THREE.Vector3>
  ): THREE.Vector3 | null => {
    for (let layer = 0; layer < networks.length; layer++) {
      for (let row = 0; row < networks[layer].length; row++) {
        for (let col = 0; col < networks[layer][row].length; col++) {
          const node = networks[layer][row][col];
          if (node && node.word.toLowerCase() === word.toLowerCase()) {
            const position = nodePositions.get(node.id);
            if (position) return position;
          }
        }
      }
    }
    return null;
  };
  
  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[400px] border rounded-lg overflow-hidden"
      ></div>
      
      {/* Hover tooltip */}
      {hoveredNode && (
        <div
          className="absolute bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded shadow-lg text-sm z-10 pointer-events-none"
          style={{
            left: hoveredNode.x + 10,
            top: hoveredNode.y + 10,
            maxWidth: '200px'
          }}
        >
          <div className="font-bold">{hoveredNode.node.word}</div>
          <div className="opacity-75 text-xs">
            Aktivasyon: {(hoveredNode.node.activation * 100).toFixed(0)}%
          </div>
          <div className="opacity-75 text-xs">
            Kullanım: {hoveredNode.node.count} kez
          </div>
          {hoveredNode.node.category && (
            <div className="opacity-75 text-xs">
              Kategori: {hoveredNode.node.category}
            </div>
          )}
        </div>
      )}
      
      {/* Controls help */}
      <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 text-xs p-1 rounded">
        <div>Fare tekerleği - Yakınlaştır/Uzaklaştır</div>
        <div>Sol tık + Sürükle - Kamerayı döndür</div>
        <div>Sağ tık + Sürükle - Kaydır</div>
      </div>
    </div>
  );
}
