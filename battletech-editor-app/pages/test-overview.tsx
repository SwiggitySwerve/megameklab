import React from 'react'
import Head from 'next/head'
import { MultiUnitProvider } from '../components/multiUnit/MultiUnitProvider'
import { OverviewTabV2 } from '../components/overview/OverviewTabV2'

const TestOverviewPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Test Overview | BattleTech Editor</title>
      </Head>
      
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Overview Tab Test</h1>
          
          <MultiUnitProvider>
            <div className="bg-slate-800 rounded-lg p-4">
              <OverviewTabV2 readOnly={false} />
            </div>
          </MultiUnitProvider>
        </div>
      </div>
    </>
  )
}

export default TestOverviewPage 