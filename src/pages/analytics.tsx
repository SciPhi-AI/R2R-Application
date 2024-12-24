import React, { useState, useEffect, useCallback } from 'react';

import AverageScoreCard from '@/components/AverageScoreCard';
import DAUCard from '@/components/DAUCard';
import ErrorsCard from '@/components/ErrorsCard';
import Layout from '@/components/Layout';
import LLMCompletionCard from '@/components/LLMCompletionCard';
import RequestsCard from '@/components/RequestsCard';
import USMapCard from '@/components/USMapCard';
import WAUCard from '@/components/WAUCard';
import WorldMapCard from '@/components/WorldMapCard';
import { useUserContext } from '@/context/UserContext';

const processLogData = (data: any) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    console.error('Invalid data structure:', data);
    return [];
  }

  const { entries } = data.results[0].entries;

  if (!Array.isArray(entries)) {
    console.error('Invalid entries structure:', entries);
    return [];
  }

  return entries
    .filter((entry: any) => entry && entry.key === 'completion_record')
    .map((entry: any) => {
      try {
        const value = JSON.parse(entry.value);
        return {
          date: new Date(value.timestamp),
          score: Array.isArray(value.score) ? value.score[0] : value.score,
        };
      } catch (error) {
        console.error('Error parsing entry:', error, entry);
        return null;
      }
    })
    .filter(
      (entry): entry is { date: Date; score: number } =>
        entry !== null &&
        !isNaN(entry.date.getTime()) &&
        typeof entry.score === 'number'
    )
    .filter((entry) => entry.date >= sevenDaysAgo && entry.date <= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const Analytics: React.FC = () => {
  const { getClient } = useUserContext();
  const [scoreData, setScoreData] = useState<
    Array<{ date: Date; score: number }>
  >([]);

  const fetchLogs = useCallback(async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const data = {};
      const processedData = processLogData(data);
      setScoreData(processedData);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }, [getClient]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <Layout pageTitle="Analytics">
      <main className="w-full flex flex-col min-h-screen container">
        <div className="mt-[5rem] sm:mt-[5rem]">
          <div className="grid grid-cols-2 gap-6 py-8">
            <div className="col-span-1">
              <RequestsCard />
            </div>
            <div className="col-span-1">
              <ErrorsCard />
            </div>
            <div className="col-span-1">
              <AverageScoreCard scoreData={scoreData} />
            </div>
            <div className="col-span-1">
              <USMapCard />
            </div>
            <div className="col-span-2">
              <WorldMapCard />
            </div>
            <div className="col-span-1">
              <DAUCard />
            </div>
            <div className="col-span-1">
              <WAUCard />
            </div>
            <div className="col-span-2">
              <LLMCompletionCard />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Analytics;
