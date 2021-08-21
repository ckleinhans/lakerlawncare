import React from "react";
import Autosuggest from "react-autosuggest";

// PROPS REQUIRED:
// valueArray - all values for suggestions
// handleChange - function to call when changing the input
// value - the value of the autocomplete
class Autocomplete extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
    };
  }

  getSuggestions = (value) => {
    const { valueArray } = this.props;
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0
      ? []
      : valueArray.filter(
          (name) => name.toLowerCase().slice(0, inputLength) === inputValue
        );
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: this.getSuggestions(value),
    });
  };

  renderSuggestion = (suggestion) => <div>{suggestion}</div>;

  getSuggestionValue = (suggestion) => suggestion;

  // reset customer if invalid, called onBlur (when input loses focus)
  handleReset = () => {
    const { valueArray, onChange, value } = this.props;

    // If value not customer name, set value to empty string
    if (!valueArray.find((item) => item === value)) {
      onChange("");
    }
  };

  render() {
    const { suggestions } = this.state;
    const { value, onChange, className, placeholder, disabled } = this.props;

    const inputProps = {
      placeholder,
      value,
      name: "customerName",
      onBlur: () => this.handleReset(),
      onChange: (e, { newValue }) => onChange(newValue),
      onFocus: (event) => event.target.select(),
    };

    if (className) inputProps.className = className;
    if (disabled) {
      inputProps.disabled = disabled;
      inputProps.style = { backgroundColor: "#e9ecef" };
    }

    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}

export default Autocomplete;
