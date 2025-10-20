import React from 'react';
import PropTypes from 'prop-types';
import CommessaListView from './CommessaListView.jsx';

const ensureMap = (collection) => {
  if (!collection) {
    return new Map();
  }
  if (collection instanceof Map) {
    return collection;
  }
  const map = new Map();
  Object.entries(collection).forEach(([key, value]) => {
    map.set(key, value);
  });
  return map;
};

export default function CommessaListContainer({
  commesse,
  tabs,
  activeTabId,
  onChangeTab,
  onCloseTab,
  onRefresh,
  error,
}) {
  const commessaMap = React.useMemo(() => ensureMap(commesse), [commesse]);

  return (
    <CommessaListView
      commessaMap={commessaMap}
      tabs={tabs}
      activeTabId={activeTabId}
      onChangeTab={onChangeTab}
      onCloseTab={onCloseTab}
      onRefresh={onRefresh}
      error={error}
    />
  );
}

const tabShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  kind: PropTypes.oneOf(['info', 'commessa']).isRequired,
  commessaId: PropTypes.string,
});

CommessaListContainer.propTypes = {
  commesse: PropTypes.oneOfType([
    PropTypes.instanceOf(Map),
    PropTypes.object,
  ]),
  tabs: PropTypes.arrayOf(tabShape).isRequired,
  activeTabId: PropTypes.string.isRequired,
  onChangeTab: PropTypes.func,
  onCloseTab: PropTypes.func,
  onRefresh: PropTypes.func,
  error: PropTypes.object,
};
