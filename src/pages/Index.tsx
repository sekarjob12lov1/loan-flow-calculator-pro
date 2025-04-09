
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoldLoanCalculator from '@/components/GoldLoanCalculator';
import PersonalLoanCalculator from '@/components/PersonalLoanCalculator';
import VersionSelector from '@/components/VersionSelector';
import { useAppVersion } from '@/App';

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>('gold');
  const { version, setVersion } = useAppVersion();

  const appVersions = [
    { value: "v1.0", label: "Version 1.0" },
    { value: "v2.0", label: "Version 2.0" }
  ];

  const handleVersionChange = (newVersion: string) => {
    setVersion(newVersion);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Comprehensive Loan Calculator</h2>
          <VersionSelector 
            currentVersion={version} 
            onChange={handleVersionChange} 
            versions={appVersions} 
          />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="gold" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="gold">Gold Loan Calculator</TabsTrigger>
              <TabsTrigger value="personal">Personal Loan Calculator</TabsTrigger>
            </TabsList>
            
            <TabsContent value="gold">
              <GoldLoanCalculator />
            </TabsContent>
            
            <TabsContent value="personal">
              <PersonalLoanCalculator />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
