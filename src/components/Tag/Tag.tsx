import { Text } from "components/Typography/Text/Text"
import { ReactNode } from "react"
import { STag } from "./Tag.styled"

export const Tag = (props: { children?: ReactNode; className?: string }) => {
  return (
    <STag className={props.className}>
      <Text
        fs={9}
        sx={{ color: "black" }}
        font="GeistMedium"
        css={{ textTransform: "uppercase", lineHeight: "normal" }}
      >
        {props.children}
      </Text>
    </STag>
  )
}
