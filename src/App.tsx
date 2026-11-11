import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { CampaignTable } from './features/campaigns/CampaignTable';
import { useAppDispatch, useAppSelector } from './store';
import { fetchCampaigns, selectCampaignsError, selectLoadState } from './store/campaignsSlice';

const Shell = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space(6)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(6)};
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
  h1 { font-size: ${({ theme }) => theme.font.size.xxl}; }
  p { margin: ${({ theme }) => theme.space(1)} 0 0; color: ${({ theme }) => theme.colors.textMuted}; }
`;

const Notice = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding: ${({ theme }) => theme.space(4)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $error }) => ($error ? theme.colors.dangerSubtle : theme.colors.surface)};
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.textMuted)};
`;

export default function App() {
  const dispatch = useAppDispatch();
  const loadState = useAppSelector(selectLoadState);
  const error = useAppSelector(selectCampaignsError);
  const [selectedId, setSelectedId] = useState<string>();
  const onSelect = useCallback((id: string) => setSelectedId(id), []);

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  return (
    <Shell>
      <TopBar>
        <div>
          <h1>Campaign Manager</h1>
          <p>Create campaigns, track budget pacing and manage delivery.</p>
        </div>
      </TopBar>
      <main>
        {loadState === 'loading' && <Notice role="status">Loading campaigns…</Notice>}
        {error && <Notice role="alert" $error>{error}</Notice>}
        {loadState === 'succeeded' && <CampaignTable selectedId={selectedId} onSelect={onSelect} />}
      </main>
    </Shell>
  );
}
