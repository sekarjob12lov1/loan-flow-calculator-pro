
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoldLoanCalculator from '@/components/GoldLoanCalculator';
import PersonalLoanCalculator from '@/components/PersonalLoanCalculator';

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>('gold');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Comprehensive Loan Calculator</h2>
        
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
