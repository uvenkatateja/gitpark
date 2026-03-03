import { useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SearchBar } from '@/components/ui/SearchBar';
import { CarMesh } from '@/components/3d/Car';
import { ParkingSpace } from '@/components/3d/ParkingSpace';
import { Car, Zap, Eye, GitCompare } from 'lucide-react';
import { CarProps } from '@/types/car';

const MOCK_CARS: CarProps[] = [
  { id: 1, name: 'react-app', color: '#f1e05a', size: 'sedan', isCrooked: false, isCovered: false, isDusty: false, stars: 42, topics: ['react'], isPinned: true, url: '#', description: 'A React app', language: 'JavaScript', lastPushed: new Date().toISOString(), forks: 12 },
  { id: 2, name: 'api-server', color: '#3572A5', size: 'suv', isCrooked: false, isCovered: false, isDusty: false, stars: 128, topics: ['python', 'api'], isPinned: false, url: '#', description: 'Python API', language: 'Python', lastPushed: new Date().toISOString(), forks: 30 },
  { id: 3, name: 'rust-cli', color: '#dea584', size: 'compact', isCrooked: true, isCovered: false, isDusty: true, stars: 5, topics: ['cli'], isPinned: false, url: '#', description: 'A CLI tool', language: 'Rust', lastPushed: '2023-01-01T00:00:00Z', forks: 1 },
  { id: 4, name: 'old-project', color: '#888899', size: 'truck', isCrooked: false, isCovered: true, isDusty: true, stars: 0, topics: [], isPinned: false, url: '#', description: 'Archived', language: 'Unknown', lastPushed: '2020-06-01T00:00:00Z', forks: 0 },
  { id: 5, name: 'ts-utils', color: '#7c4dff', size: 'compact', isCrooked: false, isCovered: false, isDusty: false, stars: 89, topics: ['typescript', 'utils'], isPinned: true, url: '#', description: 'TS utilities', language: 'TypeScript', lastPushed: new Date().toISOString(), forks: 22 },
  { id: 6, name: 'go-service', color: '#00ADD8', size: 'sedan', isCrooked: true, isCovered: false, isDusty: false, stars: 15, topics: ['go', 'microservice'], isPinned: false, url: '#', description: 'Go microservice', language: 'Go', lastPushed: new Date().toISOString(), forks: 4 },
];

function DemoScene() {
  const COLS = 3;
  const SPACE_W = 2.8;
  const SPACE_D = 4.8;
  const ROW_GAP = 2;

  return (
    <Canvas camera={{ position: [0, 18, 14], fov: 50 }} style={{ background: 'transparent' }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[8, 15, 8]} intensity={0.7} />
        <pointLight position={[-8, 10, -8]} intensity={0.2} color="#4488ff" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[16, 20]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.95} />
        </mesh>

        {MOCK_CARS.map((car, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = (col - 1) * SPACE_W;
          const z = -(row * (SPACE_D + ROW_GAP)) + 3;
          return (
            <group key={car.id}>
              <ParkingSpace position={[x, 0, z]} isReserved={car.isPinned} />
              <CarMesh car={car} position={[x, 0, z]} />
            </group>
          );
        })}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 3}
        />
      </Suspense>
    </Canvas>
  );
}

const FEATURES = [
  {
    icon: Car,
    title: 'Repos as Cars',
    desc: 'Every repository becomes a unique car — sized by code, colored by language, detailed by activity.',
  },
  {
    icon: Eye,
    title: 'Click to Inspect',
    desc: 'Click any car to see repo details — stars, forks, language, last commit, and a direct GitHub link.',
  },
  {
    icon: Zap,
    title: 'Real-Time Data',
    desc: 'Pulls live data from GitHub API. Search any public username and see their lot instantly.',
  },
  {
    icon: GitCompare,
    title: 'Compare Lots',
    desc: 'Put two developers side by side and compare their parking lots, stats, and repo collections.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-24 pb-8 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="font-pixel text-3xl sm:text-5xl text-foreground mb-4 leading-tight">
            Your GitHub repos,
            <br />
            <span className="text-primary text-glow-yellow">parked in style.</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto mb-8">
            Every repository becomes a car in your own 3D parking lot.
            Sized by code, colored by language, detailed by activity.
          </p>
          <SearchBar size="large" className="max-w-md mx-auto mb-2" />
          <p className="text-muted-foreground text-xs">
            Try: <button onClick={() => {}} className="text-primary hover:underline">torvalds</button>{' · '}
            <button className="text-primary hover:underline">sindresorhus</button>{' · '}
            <button className="text-primary hover:underline">tj</button>
          </p>
        </div>
      </section>

      {/* 3D Demo */}
      <section className="h-[45vh] sm:h-[50vh] w-full max-w-4xl mx-auto px-4">
        <div className="w-full h-full rounded border border-border overflow-hidden bg-asphalt">
          <DemoScene />
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-pixel text-xl text-center text-foreground mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded p-5">
                <f.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-pixel text-sm text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mapping table */}
      <section className="pb-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <h2 className="font-pixel text-xl text-center text-foreground mb-8">Repo → Car Mapping</h2>
          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-left font-pixel text-foreground py-3 px-4">Repo Attribute</th>
                  <th className="text-left font-pixel text-foreground py-3 px-4">Car Visual</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ['Repo size (KB)', 'Car size — compact / sedan / SUV / truck'],
                  ['Primary language', 'Car color (JS=yellow, Python=blue, etc.)'],
                  ['Stars count', 'Gold bar on roof'],
                  ['Last commit date', 'Fresh paint (active) or dusty (old)'],
                  ['Is forked', 'Parked slightly crooked'],
                  ['Is archived', 'Covered with a grey tarp'],
                  ['Topics/tags', 'Bumper sticker badges'],
                ].map(([attr, visual]) => (
                  <tr key={attr} className="border-b border-border last:border-0">
                    <td className="py-2.5 px-4 text-foreground">{attr}</td>
                    <td className="py-2.5 px-4">{visual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="font-pixel text-xs text-muted-foreground">
          Repo Parking Lot — Built with React Three Fiber & GitHub API
        </p>
      </footer>
    </div>
  );
}
