import { defineComponent } from "vue";
import { Stream } from "../index";

interface Props {
  stream: Stream;
}

export default defineComponent(
  (props: Props) => {
    return () => <div>{props.stream}</div>;
  },
  {
    name: "",
    props: [],
  },
);
