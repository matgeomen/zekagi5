import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AdvancedAI } from '../lib/AdvancedAI';
import { Brain, Zap, TrendingUp, Cpu, Eye, Sparkles } from 'lucide-react';

interface AIStatusPanelProps {
  advancedAI: AdvancedAI;
  isVisible: boolean;
  onClose: () => void;
}

export const AIStatusPanel: React.FC<AIStatusPanelProps> = ({ 
  advancedAI, 
  isVisible, 
  onClose 
}) => {
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      // İlk yükleme
      updateAIStatus();

      // Her 3 saniyede bir güncelle
      const interval = setInterval(updateAIStatus, 3000);
      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isVisible, advancedAI]);

  const updateAIStatus = () => {
    try {
      const status = advancedAI.getAIStatus();
      setAiStatus(status);
    } catch (error) {
      console.error('AI durumu alınırken hata:', error);
    }
  };

  if (!isVisible || !aiStatus) return null;

  const getCapabilityColor = (level: number) => {
    if (level >= 90) return 'bg-green-500';
    if (level >= 70) return 'bg-blue-500';
    if (level >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCapabilityBadge = (level: number) => {
    if (level >= 95) return { text: 'Usta', color: 'bg-gradient-to-r from-purple-500 to-pink-500' };
    if (level >= 90) return { text: 'Uzman', color: 'bg-green-500' };
    if (level >= 80) return { text: 'İleri', color: 'bg-blue-500' };
    if (level >= 70) return { text: 'Orta', color: 'bg-yellow-500' };
    return { text: 'Başlangıç', color: 'bg-gray-500' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gelişmiş AI Durumu
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Yapay zeka yetenekleri ve öğrenme metrikleri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                     p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Genel Bakış
              </TabsTrigger>
              <TabsTrigger value="capabilities" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Yetenekler
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Metrikler
              </TabsTrigger>
              <TabsTrigger value="neural" className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Sinir Ağları
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      Genel Zeka
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {aiStatus.overallIntelligence.toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gelişmiş AI Seviyesi
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Evrim İlerlemesi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {aiStatus.evolutionProgress.toFixed(1)}%
                    </div>
                    <Progress value={aiStatus.evolutionProgress} className="mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-purple-600" />
                      Sinir Ağı Gücü
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {(aiStatus.neuralPathwayStrength * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Bağlantı Kuvveti
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-600" />
                      Toplam Etkileşim
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {aiStatus.metrics.totalInteractions.toLocaleString('tr')}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Öğrenme Fırsatı
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="capabilities" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiStatus.capabilities.map((capability: any) => {
                  const badge = getCapabilityBadge(capability.level);
                  return (
                    <Card key={capability.name} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{capability.name}</CardTitle>
                          <Badge className={`${badge.color} text-white`}>
                            {badge.text}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {capability.description}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Seviye</span>
                          <span className="text-sm font-bold">{capability.level.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={capability.level} 
                          className="h-2"
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Öğrenme Performansı</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Öğrenme Hızı</span>
                      <span className="font-bold">{aiStatus.metrics.learningRate.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uyum Hızı</span>
                      <span className="font-bold">{aiStatus.metrics.adaptationSpeed.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bilgi Saklama</span>
                      <span className="font-bold">{(aiStatus.metrics.knowledgeRetention * 100).toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bilişsel Yetenekler</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Desen Tanıma</span>
                      <span className="font-bold">{aiStatus.metrics.patternRecognition.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yaratıcılık İndeksi</span>
                      <span className="font-bold">{aiStatus.metrics.creativityIndex.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Problem Çözme</span>
                      <span className="font-bold">{aiStatus.metrics.problemSolvingAbility.toFixed(2)}x</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="neural" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sinir Ağı Aktivitesi</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI'ın sinir yolları ve bağlantı gücü
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Cpu className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sinir Ağları Aktif</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ortalama bağlantı gücü: {(aiStatus.neuralPathwayStrength * 100).toFixed(1)}%
                    </p>
                    <div className="mt-4">
                      <Progress value={aiStatus.neuralPathwayStrength * 100} className="w-64 mx-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};