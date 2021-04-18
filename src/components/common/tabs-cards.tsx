import {
    Tabs,
} from 'antd';

const { TabPane } = Tabs;

type TabCardValue = {
    name: string
    content: React.ReactNode
}

type TabCardProps = {
    values: TabCardValue[]
}

const TabsCards = ({ values }: TabCardProps) => {
    const components = values.map((value: TabCardValue, index: number) => <TabPane tab={value.name} key={index}>{value.content}</TabPane>);

    return <Tabs type="card">{components}</Tabs>
}

export default TabsCards;