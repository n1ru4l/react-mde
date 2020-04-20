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

/**
 * @source https://github.com/jwarby/merge-ranges
 */
const mergeRanges = (ranges: [number, number][]):[number, number][] => {
    if (!(ranges && ranges.length)) {
      return [];
    }
  
    // Stack of final ranges
    const stack = [];
  
    // Sort according to start value
    ranges.sort(function(a, b) {
      return a[0] - b[0];
    });
  
    // Add first range to stack
    stack.push(ranges[0]);
  
    ranges.slice(1).forEach(function(range, i) {
      var top = stack[stack.length - 1];
  
      if (top[1] < range[0]) {
  
        // No overlap, push range onto stack
        stack.push(range);
      } else if (top[1] < range[1]) {
  
        // Update previous range
        top[1] = range[1];
      }
    });
  
    return stack;
}

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
    onScroll && onScroll(event)
  }, [onScroll])

  const handleArrayHighlight = (input: string, sections: [number, number][]) => {
    let offset = 0;
    
    let elements: React.ReactNode[] = [];

    sections.forEach(([start, end]) => {
      const part = input.slice(offset, start)
      if (part) {
        elements.push(part)
      }
      elements.push(React.createElement("span", { key: `${start}_${end}`, style: { color:"inherit", padding:0, backgroundColor: "yellow" }}, input.slice(start, end)))
      offset = end;
    })

    if (offset < input.length - 1) {
      elements.push(input.slice(offset, input.length - 1))
    }

    return elements;
  }

  const highlights = React.useMemo(() => {
    return handleArrayHighlight(state, mergeRanges(highlight(state)));
  }, [props.value])
  return (
    <>
      <div
        ref={backdropRef} 
        style={{ 
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
      >{highlights}</div>
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

const findIndicies = (source: string, needle: string)  => {
  if (!source) {
    return [];
  }
  // if find is empty string return all indexes.
  if (!needle) {
    // or shorter arrow function:
    // return source.split('').map((_,i) => i);
    return source.split('').map(function(_, i) { return i; });
  }
  var result = [];
  for (let i = 0; i < source.length; ++i) {
    // If you want to search case insensitive use 
    // if (source.substring(i, i + find.length).toLowerCase() == find) {
    if (source.substring(i, i + needle.length) == needle) {
      result.push(i);
    }
  }
  return result;
}

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
            highlight: (input) => {
              const indicies = findIndicies(input, "Hello")
              return indicies.map(index => [index, index + "Hello".length])
            }
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
