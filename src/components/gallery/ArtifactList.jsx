import React from 'react';
import ArtifactGridView from './ArtifactGridView';
import ArtifactListView from './ArtifactListView';

const ArtifactList = ({
  artifacts,
  viewMode,
  isAdmin,
  user,
  onEdit,
  onDelete,
  onArtifactClick
}) => {
  if (artifacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No artifacts found</p>
      </div>
    );
  }

  return viewMode === 'grid' ? (
    <ArtifactGridView
      artifacts={artifacts}
      isAdmin={isAdmin}
      user={user}
      onEdit={onEdit}
      onDelete={onDelete}
      onArtifactClick={onArtifactClick}
    />
  ) : (
    <ArtifactListView
      artifacts={artifacts}
      isAdmin={isAdmin}
      user={user}
      onEdit={onEdit}
      onDelete={onDelete}
      onArtifactClick={onArtifactClick}
    />
  );
};

export default ArtifactList;