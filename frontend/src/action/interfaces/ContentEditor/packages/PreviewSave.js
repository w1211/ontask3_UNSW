// import React, { useState } from 'react';

// generateHtml = () => {
//   const { value } = this.state;

//   const html = new Html({ rules });
//   const output = value.document.nodes.map(node => {
//     const pseudoValue = { document: { nodes: [node] } };
//     return html.serialize(pseudoValue);
//   });

//   return [...output];
// };

// export function previewContent() {
//   const { onPreview } = this.props;
//   const { value } = this.state;

//   const content = {
//     blockMap: value.toJSON(),
//     html: this.generateHtml()
//   };

//   this.setState({ error: null, previewing: true });

//   onPreview({
//     content,
//     onSuccess: () => this.setState({ previewing: false }),
//     onError: error => this.setState({ error })
//   });
// };

// export const PreviewButton = (props) => {
//   const [previewing, setPreviewing] = useState()

//   return (
//     <Button
//       loading={previewing}
//       style={{ marginRight: "10px" }}
//       size="large"
//       onClick={this.previewContent}
//     >
//       Preview
//     </Button>
//   );
// };