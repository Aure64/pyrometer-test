import React from 'react';
import { useGetNodesQuery, GetNodesQuery } from './api';
import NodeCard from './NodeCard';
import PaginatedSection from './PaginatedSection';

export default ({ isVisible = true }: { isVisible?: boolean }) => (
  <PaginatedSection
    title="Nodes"
    storageNs="nodes"
    query={useGetNodesQuery}
    isVisible={isVisible}
    getCount={(data: GetNodesQuery) => data.nodes.totalCount}
    render={({ nodes: { items } }: GetNodesQuery) =>
      items.map((node) => <NodeCard key={node.url} node={node} />)
    }
  />
);
