
import React from 'react';
import useDocumentSummary from '@/hooks/useDocumentSummary';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { FileText } from 'lucide-react';

const DocumentSummary: React.FC = () => {
  const { nonConforme, partiellementConforme, conforme, total, exclusion, conformityRate } = useDocumentSummary();
  
  // Data for pie chart
  const data = [
    { name: 'Non Conforme', value: nonConforme, color: '#FF6B6B' },
    { name: 'Partiellement Conforme', value: partiellementConforme, color: '#FFD166' },
    { name: 'Conforme', value: conforme, color: '#06D6A0' }
  ].filter(item => item.value > 0);

  // If no data, add a placeholder
  const chartData = data.length > 0 ? data : [{ name: 'Non Conforme', value: 1, color: '#FF6B6B' }];

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Synthèse de la gestion documentaire</h2>
      
      <Card className="p-6">
        <CardContent className="p-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold"></h3>
            <div className="flex items-center text-blue-600">
              <FileText className="mr-2 h-5 w-5" />
            </div>
          </div>
          
          {/* Status cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#F5F5F5] rounded-md p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">{exclusion}</div>
              <div className="text-sm text-gray-800">Exclusion</div>
            </div>
            
            <div className="bg-[#FFDEE2] rounded-md p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{nonConforme}</div>
              <div className="text-sm text-red-600">Non Conforme</div>
            </div>
            
            <div className="bg-[#FEF7CD] rounded-md p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{partiellementConforme}</div>
              <div className="text-sm text-yellow-600">Part. Conforme</div>
            </div>
            
            <div className="bg-[#F2FCE2] rounded-md p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{conforme}</div>
              <div className="text-sm text-green-600">Conforme</div>
            </div>
          </div>
          
          {/* Chart and statistics sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pie chart section */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-center">Répartition des documents</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill={percent > 0 ? "#000" : "transparent"}
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center items-center mt-4 gap-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#FF6B6B] mr-2"></div>
                  <span>Non Conforme</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#FFD166] mr-2"></div>
                  <span>Partiellement Conforme</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#06D6A0] mr-2"></div>
                  <span>Conforme</span>
                </div>
              </div>
            </div>
            
            {/* Statistics section */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-center">Statistiques complémentaires</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-md flex justify-between items-center">
                  <span className="font-medium">Documents exclus :</span>
                  <span className="text-xl font-bold">{exclusion}</span>
                </div>
                
                <div className="bg-green-50 p-4 rounded-md flex justify-between items-center">
                  <span className="font-medium text-green-700">Taux de conformité :</span>
                  <span className="text-xl font-bold text-green-700">{conformityRate}%</span>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-blue-700">
                    Le taux de conformité est calculé sur la base des documents non exclus. 
                    Soit {conforme} documents conformes sur un total de {total} documents actifs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentSummary;

