import { Flex, Typography } from "antd"
import { Content } from "./components/Content"

const { Title } = Typography

const App = () => {
  return (
    <Flex
      vertical
      align="center"
      gap="small"
      justify="center"
      style={{ padding: "12px" }}
    >
      <Title>RBTC file converter</Title>
      <Content />
    </Flex>
  )
}

export default App
