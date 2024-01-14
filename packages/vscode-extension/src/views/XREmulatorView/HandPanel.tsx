/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { EmulatorSettings, emulatorStates } from './core/emulator-states';
import { changeHandPose, updatePinchValue } from './core/messenger';

import { HAND_STRINGS } from './core/constants';
import { createAnalogPressFunction } from './ControllerPanel';

export function HandPanel({ deviceKey }) {
	const strings = HAND_STRINGS[deviceKey];
	const pressRef = React.createRef<HTMLButtonElement>();
	const rangeRef = React.createRef<HTMLInputElement>();
	const poseSelectRef = React.createRef<HTMLSelectElement>();

	function onHandPoseChange() {
		EmulatorSettings.instance.handPoses[strings.name] =
			poseSelectRef.current.value;
		EmulatorSettings.instance.write();
		changeHandPose(deviceKey);
	}

	function onRangeInput() {
		emulatorStates.pinchValues[strings.name] = parseFloat(rangeRef.current.value) / 100;
		updatePinchValue(deviceKey);
	}

	const onPressAnalog = createAnalogPressFunction(
		pressRef,
		rangeRef,
		onRangeInput,
	);

	React.useEffect(onRangeInput, []);

	return (
		<div className="col">
			<div className="component-container">
				<div className="card controller-card hand-card">
					<div className="card-header">
						<img
							src={`./res/icons/xr-emulator/${strings.name}.png`}
							className="control-icon"
						/>
						<span className="control-label">{strings.displayName}</span>
					</div>
					<div className="card-body">
						<div className="row">
							<div className="col-4 d-flex align-items-center">
								<span className="control-label">Pose</span>
							</div>
							<div className="col-8 d-flex justify-content-end">
								<div>
									<select
										ref={poseSelectRef}
										className="form-select btn special-button"
										onChange={onHandPoseChange}
										defaultValue={
											EmulatorSettings.instance.handPoses[strings.name]
										}
									>
										<option value="relaxed">relaxed</option>
										<option value="point">point</option>
									</select>
								</div>
							</div>
						</div>
						<div className="row">
							<div className="col-3 d-flex align-items-center">
								<span className="control-label">Pinch</span>
							</div>
							<div className="col-9 d-flex justify-content-end">
								<div className="control-button-group">
									<button
										ref={pressRef}
										type="button"
										className="btn special-button"
										onClick={onPressAnalog}
									>
										<img src="./res/icons/xr-emulator/hand-pose.png" />
									</button>
									<input
										ref={rangeRef}
										type="range"
										className="form-range special-button"
										onInput={onRangeInput}
										defaultValue={0}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}