import React from "react";
import {
  convertToRaw,
  CompositeDecorator,
  Editor,
  EditorState,
  Modifier,
  RichUtils
} from "draft-js";
import "./Editor.css";

const BLOCK_TYPES = [
  { label: "H1", style: "header-one" },
  //   { label: "H2", style: "header-two" },
  //   { label: "H3", style: "header-three" },
  //   { label: "H4", style: "header-four" },
  //   { label: "H5", style: "header-five" },
  //   { label: "H6", style: "header-six" },
  { label: "Blockquote", style: "blockquote" },
  { label: "UL", style: "unordered-list-item" },
  { label: "OL", style: "ordered-list-item" }
  //   { label: "Code Block", style: "code-block" }
];

const BlockStyleControls = props => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map(type => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

const INLINE_STYLES = [
  { label: "Bold", style: "BOLD" },
  { label: "Italic", style: "ITALIC" },
  { label: "Underline", style: "UNDERLINE" }
];

const InlineStyleControls = props => {
  const currentStyle = props.editorState.getCurrentInlineStyle();

  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map(type => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

class StyleButton extends React.Component {
  constructor(props) {
    super(props);
    this.onToggle = e => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }
  render() {
    let style;
    if (this.props.active) {
      style = { ...styles.styleButton, ...colorStyleMap[this.props.style] };
    } else {
      style = styles.styleButton;
    }
    return (
      <span style={style} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

var COLORS = [
  { label: "Red", style: "red" },
  { label: "Orange", style: "orange" },
  { label: "Yellow", style: "yellow" },
  { label: "Green", style: "green" },
  { label: "Blue", style: "blue" },
  { label: "Indigo", style: "indigo" },
  { label: "Violet", style: "violet" }
];

const ColorControls = props => {
  var currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div style={styles.controls}>
      {COLORS.map(type => (
        <StyleButton
          key={type.style}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

// This object provides the styling information for our custom color
// styles.
const colorStyleMap = {
  red: {
    color: "rgba(255, 0, 0, 1.0)"
  },
  orange: {
    color: "rgba(255, 127, 0, 1.0)"
  },
  yellow: {
    color: "#f7c243"
  },
  green: {
    color: "rgba(0, 180, 0, 1.0)"
  },
  blue: {
    color: "rgba(0, 0, 255, 1.0)"
  },
  indigo: {
    color: "rgba(75, 0, 130, 1.0)"
  },
  violet: {
    color: "rgba(127, 0, 255, 1.0)"
  }
};

class LinkEditorExample extends React.Component {
  constructor(props) {
    super(props);
    const decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: Link
      }
    ]);
    this.state = {
      editorState: EditorState.createEmpty(decorator),
      showURLInput: false,
      urlValue: ""
    };
    this.focus = () => this.refs.editor.focus();
    this.onChange = editorState => this.setState({ editorState });
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      const rawState = convertToRaw(content);
      console.log(rawState);
      console.log(JSON.stringify(rawState));
    };
    this.promptForLink = this._promptForLink.bind(this);
    this.onURLChange = e => this.setState({ urlValue: e.target.value });
    this.confirmLink = this._confirmLink.bind(this);
    this.onLinkInputKeyDown = this._onLinkInputKeyDown.bind(this);
    this.removeLink = this._removeLink.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.toggleColor = toggledColor => this._toggleColor(toggledColor);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
  }

  handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return "handled";
    }
    return "not-handled";
  }

  _promptForLink(e) {
    e.preventDefault();
    const { editorState } = this.state;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      const contentState = editorState.getCurrentContent();
      const startKey = editorState.getSelection().getStartKey();
      const startOffset = editorState.getSelection().getStartOffset();
      const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
      const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);
      let url = "";
      if (linkKey) {
        const linkInstance = contentState.getEntity(linkKey);
        url = linkInstance.getData().url;
      }
      this.setState(
        {
          showURLInput: true,
          urlValue: url
        },
        () => {
          setTimeout(() => this.refs.url.focus(), 0);
        }
      );
    }
  }

  _confirmLink(e) {
    e.preventDefault();
    const { editorState, urlValue } = this.state;
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "LINK",
      "MUTABLE",
      { url: urlValue }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity
    });
    this.setState(
      {
        editorState: RichUtils.toggleLink(
          newEditorState,
          newEditorState.getSelection(),
          entityKey
        ),
        showURLInput: false,
        urlValue: ""
      },
      () => {
        setTimeout(() => this.refs.editor.focus(), 0);
      }
    );
  }

  _onLinkInputKeyDown(e) {
    if (e.which === 13) {
      this._confirmLink(e);
    }
  }

  _removeLink(e) {
    e.preventDefault();
    const { editorState } = this.state;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      this.setState({
        editorState: RichUtils.toggleLink(editorState, selection, null)
      });
    }
  }

  _toggleColor(toggledColor) {
    const { editorState } = this.state;
    const selection = editorState.getSelection();
    // Let's just allow one color at a time. Turn off all active colors.
    const nextContentState = Object.keys(colorStyleMap).reduce(
      (contentState, color) => {
        return Modifier.removeInlineStyle(contentState, selection, color);
      },
      editorState.getCurrentContent()
    );
    let nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      "change-inline-style"
    );
    const currentStyle = editorState.getCurrentInlineStyle();
    // Unset style override for current color.
    if (selection.isCollapsed()) {
      nextEditorState = currentStyle.reduce((state, color) => {
        return RichUtils.toggleInlineStyle(state, color);
      }, nextEditorState);
    }
    // If the color is being toggled on, apply it.
    if (!currentStyle.has(toggledColor)) {
      nextEditorState = RichUtils.toggleInlineStyle(
        nextEditorState,
        toggledColor
      );
    }
    this.onChange(nextEditorState);
  }

  _toggleBlockType(blockType) {
    const { editorState } = this.state;
    this.onChange(RichUtils.toggleBlockType(editorState, blockType));
  }

  _toggleInlineStyle(inlineStyle) {
    const { editorState } = this.state;
    this.onChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  }

  render() {
    let urlInput;
    if (this.state.showURLInput) {
      urlInput = (
        <div style={styles.urlInputContainer}>
          <input
            onChange={this.onURLChange}
            ref="url"
            style={styles.urlInput}
            type="text"
            value={this.state.urlValue}
            onKeyDown={this.onLinkInputKeyDown}
          />
          <button onMouseDown={this.confirmLink}>Confirm</button>
        </div>
      );
    }

    const { editorState } = this.state;

    return (
      <div style={styles.root}>
        <div style={styles.buttons}>
          <BlockStyleControls
            editorState={editorState}
            onToggle={this.toggleBlockType}
          />
          <InlineStyleControls
            editorState={editorState}
            onToggle={this.toggleInlineStyle}
          />
          <ColorControls
            editorState={editorState}
            onToggle={this.toggleColor}
          />
          <button onMouseDown={this.promptForLink} style={{ marginRight: 10 }}>
            Add Link
          </button>
          <button onMouseDown={this.removeLink}>Remove Link</button>
        </div>
        {urlInput}
        <div style={styles.editor} onClick={this.focus}>
          <Editor
            className="RichEditor-editor"
            stripPastedStyles={true}
            customStyleMap={colorStyleMap}
            editorState={this.state.editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
            ref="editor"
          />
        </div>
        <input
          onClick={this.logState}
          style={styles.button}
          type="button"
          value="Log State"
        />
      </div>
    );
  }
}

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "LINK"
    );
  }, callback);
}

const Link = props => {
  const { url } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={url} style={styles.link}>
      {props.children}
    </a>
  );
};

const styles = {
  root: {
    fontFamily: "sans-serif",
    padding: 20,
    width: 600
  },
  buttons: {
    marginBottom: 10
  },
  urlInputContainer: {
    marginBottom: 10
  },
  urlInput: {
    fontFamily: "'Georgia', serif",
    marginRight: 10,
    padding: 3
  },
  editor: {
    cursor: "text",
    minHeight: 80,
    padding: 10
  },
  button: {
    marginTop: 10,
    textAlign: "center"
  },
  link: {
    color: "#3b5998",
    textDecoration: "underline"
  },
  controls: {
    fontFamily: "'Helvetica', sans-serif",
    fontSize: 14,
    marginBottom: 10,
    userSelect: "none"
  },
  styleButton: {
    color: "#999",
    cursor: "pointer",
    marginRight: 16,
    padding: "2px 0"
  }
};

export default LinkEditorExample;
