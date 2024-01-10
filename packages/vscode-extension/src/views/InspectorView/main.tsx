import { createRoot } from 'react-dom/client';
import React, { useState, useEffect, type CSSProperties } from 'react';
import { ConfigProvider, Collapse, ColorPicker, Form, Input, theme, Switch, Divider } from 'antd';
import * as jsardom from '@yodaos-jsar/dom';
import { attrsToMap } from '../../utils';

function nodeTypeToString(nodeType: number): string {
  switch (nodeType) {
    case jsardom.nodes.NodeTypes.ELEMENT_NODE:
      return 'Element';
    case jsardom.nodes.NodeTypes.TEXT_NODE:
      return 'Text';
    case jsardom.nodes.NodeTypes.COMMENT_NODE:
      return 'Comment';
    case jsardom.nodes.NodeTypes.DOCUMENT_NODE:
      return 'Document';
    case jsardom.nodes.NodeTypes.DOCUMENT_TYPE_NODE:
      return 'Document Type';
    case jsardom.nodes.NodeTypes.DOCUMENT_FRAGMENT_NODE:
      return 'Document Fragment';
    default:
      return 'Unknown';
  }
}

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
  const { x = 0, y = 0, z = 0 } = props.value || {};
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

function SwitchAttribute(props) {
  return <TextLine label={props.label} value={
    <Switch size="small" checked={props.value} onChange={props.onChange} disabled />
  }></TextLine>;
}

function InspectorPanel() {
  const [selectedElement, setSelectedElement] = useState(null);

  useEffect(() => {
    function handleCommandMessage(event: MessageEvent<any>) {
      if (event.data.command === 'inspect' && event.data.element) {
        setSelectedElement(event.data.element);
      }
    }
    window.addEventListener('message', handleCommandMessage);
    return () => {
      window.removeEventListener('message', handleCommandMessage);
    };
  });

  if (selectedElement == null) {
    return <div style={{ padding: '12px' }}>No object is selected.</div>;
  } else {
    const panels: React.JSX.Element[] = [
      <Collapse.Panel header="General" key="general">
        <TextLine label="Name" value={selectedElement.nodeName} />
        <TextLine label="Type" value={nodeTypeToString(selectedElement.nodeType)} />
      </Collapse.Panel>
    ];

    if (selectedElement.attributes?.length > 0) {
      const attrsMap = attrsToMap(selectedElement.attributes);
      const attrsTextLines: React.JSX.Element[] = [];
      attrsMap.forEach((attrValue, attrName) => {
        if (attrValue != null) {
          attrsTextLines.push(
            <TextLine key={attrName} label={attrName} value={attrValue} />
          );
        }
      });
      panels.push(
        <Collapse.Panel header="Element Attributes" key="attributes">
          {attrsTextLines}
        </Collapse.Panel>
      );
    }

    if (selectedElement.transform) {
      const { transform } = selectedElement;
      panels.push(
        <Collapse.Panel header="Transform" key="transform">
          <Vector3Attribute label="Position" value={transform.position} />
          <Vector3Attribute label="Rotation" value={transform.rotation} />
          <Vector3Attribute label="Scale" value={transform.scaling} />
        </Collapse.Panel>
      )
    }

    if (selectedElement.mesh) {
      const { mesh } = selectedElement;
      panels.push(
        <Collapse.Panel header="Mesh & Geometry" key="mesh">
          <TextLine label="Total Vertices" value={mesh.vertices || 0} />
          <TextLine label="Total Faces" value={mesh.faces || 0} />
          <TextLine label="Has Normals" value={mesh.hasNormals ? 'Yes' : 'No'} />
          <TextLine label="Has Tangents" value={mesh.hasTangents ? 'Yes' : 'No'} />
          <TextLine label="Has Colors" value={mesh.hasColors ? 'Yes' : 'No'} />
          <TextLine label="Has UV" value={mesh.hasUv0 ? 'Yes' : 'No'} />
          <TextLine label="Has UV2" value={mesh.hasUv1 ? 'Yes' : 'No'} />
          <TextLine label="Has UV3" value={mesh.hasUv2 ? 'Yes' : 'No'} />
          <TextLine label="Has UV4" value={mesh.hasUv3 ? 'Yes' : 'No'} />
          <TextLine label="Has UV5" value={mesh.hasUv4 ? 'Yes' : 'No'} />
          <Divider orientation='left'></Divider>
          <SwitchAttribute label="Display Normals" value={false} />
          <SwitchAttribute label="Display Vertex Normals" value={false} />
          <SwitchAttribute label="Display Bones" value={false} />
          <SwitchAttribute label="Render Wireframe over Mesh" value={false} />
        </Collapse.Panel>
      );
    }

    if (selectedElement.material) {
      const { material } = selectedElement;
      panels.push(
        <Collapse.Panel header="Material" key="material">
          <TextLine label="Type" value={material.type || 'Unknown'} />
          <TextLine label="Name" value={material.name} />
          {material.diffuseColor && <ColorAttribute label="Diffuse Color" value={material.diffuseColor} />}
          {material.ambientColor && <ColorAttribute label="Ambient Color" value={material.ambientColor} />}
          {material.specularColor && <ColorAttribute label="Specular Color" value={material.specularColor} />}
          {material.emissiveColor && <ColorAttribute label="Emissive Color" value={material.emissiveColor} />}
          {material.type === 'PBRMaterial' && (
            <>
              <ColorAttribute label="Albedo Color" value={material.albedoColor} />
              <TextLine label="Metallic" value={material.metallic} />
              <TextLine label="Roughness" value={material.roughness} />
            </>
          )}
        </Collapse.Panel>
      )
    }

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
      <Collapse defaultActiveKey={['general', 'attributes']} size="small" bordered={false}>
        {panels}
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
