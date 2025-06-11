import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { StyleDemo } from '@/components/common/StyleDemo';

/**
 * 🎨 Página temporal para probar estilos
 * Para verificar que todos los componentes se ven correctamente
 */
export function StyleTestPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <StyleDemo />
      </div>
    </Layout>
  );
} 