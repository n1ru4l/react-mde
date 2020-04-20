import * as React from "react";
import ReactMde from "../src";
import * as Showdown from "showdown";
import { Suggestion } from "../src/types";

export interface AppState {
  value: string;
  tab: "write" | "preview";
}

const OPEN_MARK = '<mark>';
const CLOSE_MARK = '</mark>';

const CustomTextArea: React.FC<
  React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > & { highlight: (text: string) => [number, number][] }
> = React.forwardRef(({ onScroll, onChange, highlight, style, ...props}, ref) => {
  const backdropRef = React.useRef<HTMLDivElement | null>(null)
  const [state, setState] = React.useState<string>(props.value as string);
  const handleInputChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(event.target.value);
    onChange(event)
  }, []);
  const handleScroll = React.useCallback((event: React.UIEvent<HTMLTextAreaElement>) => {
    // @ts-ignore
    const scrollTop = event.target.scrollTop;
    if (backdropRef.current) backdropRef.current.scrollTop = scrollTop
    onScroll(event)
  }, [onScroll])

  const handleRegexHighlight = (input, payload) => {
    return input.replace(payload, OPEN_MARK + '$&' + CLOSE_MARK);
  }

  const handleArrayHighlight = (input: string, payload: any) => {
    let offset = 0;
    payload.forEach((element) => {

      // insert open tag
      var open = element[0] + offset;

      if(element[2]) {
        const OPEN_MARK_WITH_CLASS = '<mark style="color:inherit;padding:0;" class="' + element[2] + '">';
        input = input.slice(0, open) + OPEN_MARK_WITH_CLASS + input.slice(open);
        offset += OPEN_MARK_WITH_CLASS.length;
      } else {
        input = input.slice(0, open) + OPEN_MARK + input.slice(open);
        offset += OPEN_MARK.length;
      }

      // insert close tag
      var close = element[1] + offset;

      input = input.slice(0, close) + CLOSE_MARK + input.slice(close);
      offset += CLOSE_MARK.length;

    });
    return input;
  }

  const highlights = React.useMemo(() => {
    let highlightMarks = state;
    const payload = highlight(highlightMarks);

    // escape HTML
    highlightMarks = highlightMarks.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    if (payload) {
      switch (payload.constructor.name) {
        case 'Array':
          highlightMarks = handleArrayHighlight(highlightMarks, payload);
          break;
        case 'RegExp':
          highlightMarks = handleRegexHighlight(highlightMarks, payload);
          break;
        default:
          throw 'Unrecognized payload type!';
      }
    }

    // this keeps scrolling aligned when input ends with a newline
    highlightMarks = highlightMarks.replace(new RegExp('\\n(' + CLOSE_MARK + ')?$'), '\n\n$1');

    // highlightMarks = highlightMarks.replace(new RegExp(HighlightedTextarea.OPEN_MARK, 'g'), '<mark>');
    // highlightMarks = highlightMarks.replace(new RegExp(HighlightedTextarea.CLOSE_MARK, 'g'), '</mark>');

    return highlightMarks;
  }, [props.value])

  return (
    <>
      <div ref={backdropRef} style={{ 
        color: "transparent",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        padding: "10px",
         borderColor: "transparent", whiteSpace:"pre-wrap", wordWrap:"break-word", overflow:"hidden"
         }} 
         dangerouslySetInnerHTML={{__html: highlights }}
      />
      <textarea
        onScroll={handleScroll}
        onChange={handleInputChange}
        ref={ref}
        style={{
          ...style,
          position: "relative",
          backgroundColor: "transparent",
        }}
        {...props}
      />
    </>
  )
})

export class App extends React.Component<{}, AppState> {
  converter: Showdown.Converter;

  constructor(props) {
    super(props);
    this.state = {
      value: "**Hello world!!!**",
      tab: "write"
    };
    this.converter = new Showdown.Converter({
      tables: true,
      simplifiedAutoLink: true,
      strikethrough: true,
      tasklists: true
    });
  }

  handleValueChange = (value: string) => {
    this.setState({ value });
  };

  handleTabChange = (tab: "write" | "preview") => {
    this.setState({ tab });
  };

  loadSuggestions = async (text: string) => {
    return new Promise<Suggestion[]>((accept, reject) => {
      setTimeout(() => {
        const suggestions: Suggestion[] = [
          {
            preview: "Andre",
            value: "@andre"
          },
          {
            preview: "Angela",
            value: "@angela"
          },
          {
            preview: "David",
            value: "@david"
          },
          {
            preview: "Louise",
            value: "@louise"
          }
        ].filter(i => i.preview.toLowerCase().includes(text.toLowerCase()));
        accept(suggestions);
      }, 250);
    });
  };

  render() {
    return (
      <div className="container">
        <ReactMde
          onChange={this.handleValueChange}
          onTabChange={this.handleTabChange}
          value={this.state.value}
          generateMarkdownPreview={markdown =>
            Promise.resolve(this.converter.makeHtml(markdown))
          }
          selectedTab={this.state.tab}
          loadSuggestions={this.loadSuggestions}
          suggestionTriggerCharacters={["@"]}
          // @ts-ignore
          textAreaComponent={CustomTextArea}
          textAreaProps={{
            highlight: () => [[0, 20]]
          }}
          classes={{
            suggestionsDropdown: "bbbb"
          }}
        />
        value:{" "}
        <input
          type="text"
          value={this.state.value}
          onChange={e => {
            this.handleValueChange(e.target.value);
          }}
        />
      </div>
    );
  }
}
