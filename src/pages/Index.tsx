
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoldLoanCalculator from '@/components/GoldLoanCalculator';
import PersonalLoanCalculator from '@/components/PersonalLoanCalculator';
import VersionSelector from '@/components/VersionSelector';
import { useAppVersion } from '@/App';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>('gold');
  const { version, setVersion, currentVersionInfo } = useAppVersion();
  const { theme } = useTheme();

  const handleVersionChange = (newVersion: string) => {
    setVersion(newVersion);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Comprehensive Loan Calculator</h2>
            <p className="text-muted-foreground">{currentVersionInfo.description}</p>
          </div>
          <VersionSelector 
            currentVersion={version} 
            onChange={handleVersionChange}
          />
        </div>
        
        {/* Feature highlights card - shown only when version changes */}
        <Card className="mb-6 bg-muted/50 border border-primary/10">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Version {version} Features</h3>
            <ul className="list-disc list-inside space-y-1">
              {currentVersionInfo.features.map((feature, idx) => (
                <li key={idx} className="text-sm">{feature}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
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
