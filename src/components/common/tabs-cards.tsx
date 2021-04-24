import { Tabs } from 'antd';

const { TabPane } = Tabs;

type TabsCardValue = {
  name: string;
  content: React.ReactNode;
};

type TabCardProps = {
  tabType?: 'line' | 'card' | 'editable-card';
  values: TabsCardValue[];
};

export const TabsCards = ({ values, tabType = 'card' }: TabCardProps) => {
  const components = values.map((value: TabsCardValue, index: number) => (
    <TabPane tab={value.name} key={index}>
      {value.content}
    </TabPane>
  ));

  return <Tabs type={tabType}>{components}</Tabs>;
};
