import { createRoot } from 'react-dom/client';
import { useState, useEffect, type CSSProperties } from 'react';
import { ConfigProvider, Collapse, ColorPicker, Form, Input, theme } from 'antd';

function TextLine(props) {
  return <div style={{
    display: 'flex',
    flexDirection: 'row',
    margin: '4px 10px 4px 2px',
    alignItems: 'center',
  }}>
    <div style={{ flex: 1 }}>{props.label}</div>
    <div style={{ opacity: 0.7 }}>{props.value}</div>
  </div>;
}

function Vector3Attribute(props) {
  const { x, y, z } = props.value;
  const formItemStyle: CSSProperties = {
    height: 'fit-content',
  };
  const inputStyle: CSSProperties = {
    width: '15vw',
  };

  const value = (
    <Form
      layout="inline"
    >
      <Form.Item label="X" style={formItemStyle}>
        <Input size="small" style={inputStyle} value={x} readOnly />
      </Form.Item>
      <Form.Item label="Y" style={formItemStyle}>
        <Input size="small" style={inputStyle} value={y} readOnly />
      </Form.Item>
      <Form.Item label="Z" style={formItemStyle}>
        <Input size="small" style={inputStyle} value={z} readOnly />
      </Form.Item>
    </Form>
  );
  return <TextLine label={props.label} value={value}></TextLine>
}

function ColorAttribute(props) {
  if (props.value == null) {
    return null;
  }

  const color = props.value.map((v) => Math.round(v * 255)).reduce((colorStr, channelValue) => {
    return colorStr + channelValue.toString(16).padStart(2, '0');
  }, '#');

  return <TextLine label={props.label} value={
    <ColorPicker size="small" value={color} showText disabled />
  }></TextLine>;
}

function InspectorPanel() {
  const [selectedObject, setSelectedObject] = useState(null);

  useEffect(() => {
    function handleCommandMessage(event: MessageEvent<any>) {
      if (event.data.command === 'inspect' && event.data.gameObject) {
        setSelectedObject(event.data.gameObject);
      }
    }
    window.addEventListener('message', handleCommandMessage);
    return () => {
      window.removeEventListener('message', handleCommandMessage);
    };
  });

  if (selectedObject == null) {
    return <div style={{ padding: '4px' }}>No object is selected.</div>;
  } else {
    console.log(selectedObject);
    const { transform } = selectedObject;

    return <div>
      <style scoped>
        {`
          .ant-form-item-label {
            flex: none !important;
          }
          .ant-collapse-content-box {
            padding-block: 0 !important;
          }
          .ant-form-item-label > label {
            height: unset !important;
          }
          .ant-form-item-control-input {
            min-height: unset !important;
          }
        `}
      </style>
      <Collapse defaultActiveKey={['general', 'transform']} size="small" bordered={false}>
        <Collapse.Panel header="General" key="general">
          <TextLine label="Type" value={selectedObject.type} />
          <TextLine label="Name" value={selectedObject.name} />
          <TextLine label="Vertices" value={selectedObject.data?.meshVertices?.length || 0} />
          <TextLine label="Faces" value={selectedObject.data?.meshTriangles?.length || 0} />
        </Collapse.Panel>
        <Collapse.Panel header="Transform" key="transform">
          <Vector3Attribute label="Position" value={transform.position} />
          <Vector3Attribute label="Rotation" value={transform.rotation} />
          <Vector3Attribute label="Scale" value={transform.scale} />
        </Collapse.Panel>
        {selectedObject.data?.materialCustomType && <Collapse.Panel header="Material" key="material">
          <TextLine label="Type" value={selectedObject.data?.materialCustomType} />
          <TextLine label="Material Name" value={selectedObject.data?.materialName} />
          <TextLine label="Alpha" value={selectedObject.data?.materialAlpha} />

          {selectedObject.data.materialCustomType === 'StandardMaterial' && (
            <>
              <ColorAttribute label="Diffuse Color" value={selectedObject.data?.materialStdDiffuseColor} />
              <ColorAttribute label="Ambient Color" value={selectedObject.data?.materialStdAmbientColor} />
              <ColorAttribute label="Specular Color" value={selectedObject.data?.materialStdSpecularColor} />
              <ColorAttribute label="Emissive Color" value={selectedObject.data?.materialStdEmissiveColor} />
            </>
          )}
          {selectedObject.data.materialCustomType === 'PBRMaterial' && (
            <>
              <ColorAttribute label="Albedo" value={selectedObject.data?.materialAlbedo} />
              <TextLine label="Metallic" value={selectedObject.data?.materialMetallic} />
              <TextLine label="Roughness" value={selectedObject.data?.materialRoughness} />
            </>
          )}
        </Collapse.Panel>}
      </Collapse>
    </div>;
  }
}

const root = document.getElementById('app');
if (root) {
  const vscodeThemeKind = document.body.getAttribute('data-vscode-theme-kind');
  const themeAlgorithm = [theme.compactAlgorithm];
  if (vscodeThemeKind === 'vscode-dark') {
    themeAlgorithm.push(theme.darkAlgorithm);
  }

  createRoot(root).render(
    <ConfigProvider
      theme={{
        algorithm: themeAlgorithm,
        token: {
          motion: false,
          borderRadius: 0,
        },
      }}
    >
      <InspectorPanel />
    </ConfigProvider>
  );
}
